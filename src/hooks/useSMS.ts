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
      (data) => {
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

  const readRecentSMS = useCallback(async () => {
    try {
      if (Platform.OS !== 'android' || !SMSModule) {
        return;
      }

      if (typeof SMSModule.readRecentSMS !== 'function') {
        console.error('readRecentSMS method not available in SMSModule');
        return;
      }

      const result = await SMSModule.readRecentSMS();

      // Process each SMS and add to our storage if it's from a whitelisted sender
      for (const sms of result.messages) {
        const isWhitelisted = isWhitelistedSender(sms.sender);

        if (isWhitelisted) {
          await addMessage(sms.sender, sms.body, sms.timestamp);
        }
      }
    } catch (error) {
      console.error('Error reading recent SMS:', error);
    }
  }, []);

  const isWhitelistedSender = (sender: string): boolean => {
    if (!sender) return false;

    const whitelistedSenders = [
      'M-PESA', 'MPESA', 'Safaricom', 'IM-BANK', 'EQUITY', 'KCB', 'COOP BANK',
      'STANCHART', 'ABSA', 'DTB', 'I&M BANK', 'FAMILY BANK', 'SID', 'TALA'
    ];

    const normalizedSender = sender.toUpperCase().trim();
    return whitelistedSenders.some(whitelisted =>
      normalizedSender.includes(whitelisted.toUpperCase())
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

  const showToast = (message: string) => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Listen for incoming SMS events
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'onSMSReceived',
      data => {
        addMessage(data.sender, data.body, data.timestamp);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [addMessage]);

  return {
    messages,
    isLoading,
    loadMessages,
    retryFailedUploads,
    readRecentSMS,
  };
};
