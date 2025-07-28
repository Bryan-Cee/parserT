import { useState, useEffect, useCallback } from 'react';
import {
  NativeModules,
  DeviceEventEmitter,
  Platform,
  Alert,
  ToastAndroid,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { SMSMessage, PermissionStatus } from '../types';
import { SMSService } from '../services/SMSService';

const { SMSModule } = NativeModules;

export const useSMSPermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    receiveSMS: false,
    readSMS: false,
    hasAllPermissions: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    try {
      setIsLoading(true);

      if (SMSModule) {
        const status = await SMSModule.checkPermissions();
        setPermissionStatus(status);
      } else {
        // Fallback to react-native-permissions
        const receiveSMS = await check(PERMISSIONS.ANDROID.RECEIVE_SMS);
        const readSMS = await check(PERMISSIONS.ANDROID.READ_SMS);

        const hasReceiveSMS = receiveSMS === RESULTS.GRANTED;
        const hasReadSMS = readSMS === RESULTS.GRANTED;

        setPermissionStatus({
          receiveSMS: hasReceiveSMS,
          readSMS: hasReadSMS,
          hasAllPermissions: hasReceiveSMS && hasReadSMS,
        });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return false;

    try {
      setIsLoading(true);

      if (SMSModule) {
        const result = await SMSModule.requestPermissions();

        // Test if SMS module is working
        try {
          await SMSModule.testSMSReceiver();
        } catch (testError) {
          console.error('SMS module test failed:', testError);
        }
      } else {
        // Fallback to react-native-permissions
        await request(PERMISSIONS.ANDROID.RECEIVE_SMS);
        await request(PERMISSIONS.ANDROID.READ_SMS);
      }

      // Check permissions after request
      await checkPermissions();
      return permissionStatus.hasAllPermissions;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions, permissionStatus.hasAllPermissions]);

  // Listen for permission results from native
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'onPermissionResult',
      data => {
        setPermissionStatus(data);
        setIsLoading(false);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissionStatus,
    isLoading,
    checkPermissions,
    requestPermissions,
  };
};

export const useSMSMessages = () => {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const smsService = SMSService.getInstance();

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedMessages = await smsService.getMessages();
      setMessages(storedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [smsService]);

  const isAllowedSender = (
    sender: string,
    allowedSenders: string[],
  ): boolean => {
    if (!sender || !allowedSenders.length) return false;

    const normalizedSender = sender.toUpperCase().trim();
    return allowedSenders.some(allowed =>
      normalizedSender.includes(allowed.toUpperCase()),
    );
  };

  const addMessage = useCallback(
    async (sender: string, body: string, timestamp: number) => {
      const newMessage: SMSMessage = {
        id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        sender,
        body,
        timestamp,
        uploaded: false,
        uploadAttempts: 0,
      };

      try {
        await smsService.saveMessage(newMessage);
        setMessages(prev => [newMessage, ...prev]);

        // Attempt to upload immediately
        const uploadResult = await smsService.uploadMessage(newMessage);

        if (uploadResult.success) {
          showToast('SMS uploaded successfully');
          // Update the message in state
          setMessages(prev =>
            prev.map(msg =>
              msg.id === newMessage.id ? { ...msg, uploaded: true } : msg,
            ),
          );
        } else {
          showToast(`Upload failed: ${uploadResult.error}`);
          console.error('Upload failed:', uploadResult.error);
          // Update upload attempts
          newMessage.uploadAttempts = 1;
          await smsService.updateMessage(newMessage);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === newMessage.id ? { ...msg, uploadAttempts: 1 } : msg,
            ),
          );
        }
      } catch (error) {
        console.error('Error adding message:', error);
        showToast('Error saving SMS message');
      }
    },
    [smsService],
  );

  const readRecentSMS = useCallback(
    async (silent = false) => {
      try {
        if (Platform.OS !== 'android' || !SMSModule) {
          if (!silent)
            console.log(
              'SMS reading not available: not Android or SMSModule not available',
            );
          return;
        }

        if (typeof SMSModule.readRecentSMS !== 'function') {
          console.error('readRecentSMS method not available in SMSModule');
          return;
        }

        if (!silent) console.log('Reading recent SMS messages from phone...');
        const result = await SMSModule.readRecentSMS();
        const allowedSenders = await smsService.getAllowedSenders();

        let processedCount = 0;
        let allowedCount = 0;

        if (!silent)
          console.log(
            `Found ${result.messages?.length || 0} recent SMS messages`,
          );

        // Process each SMS and add to our storage if it's from an allowed sender
        for (const sms of result.messages || []) {
          const isAllowed = isAllowedSender(sms.sender, allowedSenders);

          if (isAllowed) {
            allowedCount++;
            // Check if message already exists to avoid duplicates
            const existingMessages = await smsService.getMessages();
            const isDuplicate = existingMessages.some(
              existing =>
                existing.sender === sms.sender &&
                existing.body === sms.body &&
                Math.abs(existing.timestamp - sms.timestamp) < 1000, // Within 1 second
            );

            if (!isDuplicate) {
              await addMessage(sms.sender, sms.body, sms.timestamp);
              processedCount++;
            }
          }
        }

        if (!silent) {
          console.log(
            `Processed ${processedCount} new messages from ${allowedCount} allowed senders`,
          );

          if (processedCount > 0) {
            showToast(`Found ${processedCount} new SMS messages`);
          }
        }

        return processedCount; // Return count for sync function
      } catch (error) {
        console.error('Error reading recent SMS:', error);
        if (!silent) showToast('Error reading SMS messages from phone');
        return 0;
      }
    },
    [smsService, addMessage],
  );

  const retryFailedUploads = useCallback(async () => {
    try {
      const successCount = await smsService.retryFailedUploads();
      showToast(`${successCount} messages uploaded successfully`);
      await loadMessages(); // Refresh the list
    } catch (error) {
      console.error('Error retrying uploads:', error);
      showToast('Error retrying uploads');
    }
  }, [smsService, loadMessages]);

  const syncMessages = useCallback(async () => {
    try {
      // First, read recent SMS from phone to get any new messages
      console.log('Sync: Reading recent SMS from phone first...');
      const newMessagesFound = (await readRecentSMS(true)) || 0; // Silent mode, default to 0

      // Now sync the messages (including any newly found ones)
      const result = await smsService.syncMessages();
      const total = result.uploaded + result.failed;

      if (newMessagesFound > 0) {
        showToast(
          `Found ${newMessagesFound} new messages, ${result.uploaded} uploaded, ${result.failed} failed`,
        );
      } else if (total > 0) {
        showToast(`${result.uploaded} uploaded, ${result.failed} failed`);
      } else {
        showToast('No new messages to sync');
      }

      // Always reload messages after sync to show current state
      await loadMessages();
    } catch (error) {
      console.error('Error syncing messages:', error);
      showToast('Error syncing messages');
    }
  }, [smsService, loadMessages, readRecentSMS]);

  const showToast = (message: string) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  useEffect(() => {
    loadMessages();
    // Also read recent SMS from phone when app starts
    readRecentSMS();
  }, [loadMessages, readRecentSMS]);

  // Periodic SMS reading (every 5 minutes when app is active)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Periodic SMS check...');
      readRecentSMS(true); // Silent mode for periodic checks
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [readRecentSMS]);

  // Listen for incoming SMS events - only process if sender is allowed
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'onSMSReceived',
      async data => {
        try {
          const allowedSenders = await smsService.getAllowedSenders();
          const isAllowed = isAllowedSender(data.sender, allowedSenders);

          if (isAllowed) {
            await addMessage(data.sender, data.body, data.timestamp);
          }
        } catch (error) {
          console.error('Error processing incoming SMS:', error);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [addMessage, smsService]);

  return {
    messages,
    isLoading,
    loadMessages,
    retryFailedUploads,
    syncMessages,
    readRecentSMS,
  };
};
