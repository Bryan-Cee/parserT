import AsyncStorage from '@react-native-async-storage/async-storage';
import { SMSMessage, UploadResult } from '../types';

const STORAGE_KEY = 'sms_messages';
const UPLOAD_LOGS_KEY = 'upload_logs';
const SERVER_URL_KEY = 'server_url';
const ALLOWED_SENDERS_KEY = 'allowed_senders';
const LAST_SYNC_KEY = 'last_sync_time';

export class SMSService {
  private static instance: SMSService;
  private serverUrl: string = 'http://10.0.2.2:8000'; // Default server URL for Android emulator

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  async setServerUrl(url: string): Promise<void> {
    this.serverUrl = url;
    await AsyncStorage.setItem(SERVER_URL_KEY, url);
  }

  async getServerUrl(): Promise<string> {
    try {
      const storedUrl = await AsyncStorage.getItem(SERVER_URL_KEY);
      if (storedUrl) {
        this.serverUrl = storedUrl;
      }
      return this.serverUrl;
    } catch (error) {
      console.error('Error getting server URL:', error);
      return this.serverUrl;
    }
  }

  async setAllowedSenders(senders: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ALLOWED_SENDERS_KEY, JSON.stringify(senders));
    } catch (error) {
      console.error('Error saving allowed senders:', error);
    }
  }

  async getAllowedSenders(): Promise<string[]> {
    try {
      const storedSenders = await AsyncStorage.getItem(ALLOWED_SENDERS_KEY);
      if (storedSenders) {
        return JSON.parse(storedSenders);
      }
      // Default allowed senders
      return [
        'M-PESA',
        'MPESA',
        'Safaricom',
        'IM-BANK',
        'EQUITY',
        'KCB',
        'COOP BANK',
        'STANCHART',
        'ABSA',
        'DTB',
        'I&M BANK',
        'FAMILY BANK',
        'SID',
        'TALA',
      ];
    } catch (error) {
      console.error('Error getting allowed senders:', error);
      return [
        'M-PESA',
        'MPESA',
        'Safaricom',
        'IM-BANK',
        'EQUITY',
        'KCB',
        'COOP BANK',
        'STANCHART',
        'ABSA',
        'DTB',
        'I&M BANK',
        'FAMILY BANK',
        'SID',
        'TALA',
      ];
    }
  }

  async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
    } catch (error) {
      console.error('Error saving last sync time:', error);
    }
  }

  async getLastSyncTime(): Promise<number> {
    try {
      const storedTime = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return storedTime ? parseInt(storedTime, 10) : 0;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return 0;
    }
  }

  async saveMessage(message: SMSMessage): Promise<void> {
    try {
      const messages = await this.getMessages();
      messages.unshift(message); // Add to beginning of array

      // Keep only last 100 messages
      if (messages.length > 100) {
        messages.splice(100);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  async getMessages(): Promise<SMSMessage[]> {
    try {
      const messagesJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (messagesJson) {
        return JSON.parse(messagesJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async uploadMessage(message: SMSMessage): Promise<UploadResult> {
    try {
      const serverUrl = await this.getServerUrl();

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${serverUrl}/upload-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: message.sender,
          body: message.body,
          timestamp: message.timestamp,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Update message as uploaded
        message.uploaded = true;
        await this.updateMessage(message);
        await this.logUpload(message, true);
        return { success: true };
      } else {
        const errorText = await response.text();
        await this.logUpload(
          message,
          false,
          `HTTP ${response.status}: ${errorText}`,
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.logUpload(message, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async updateMessage(updatedMessage: SMSMessage): Promise<void> {
    try {
      const messages = await this.getMessages();
      const index = messages.findIndex(m => m.id === updatedMessage.id);
      if (index !== -1) {
        messages[index] = updatedMessage;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }

  async retryFailedUploads(): Promise<number> {
    try {
      const messages = await this.getMessages();
      const failedMessages = messages.filter(msg => !msg.uploaded);

      let successCount = 0;
      for (const message of failedMessages) {
        const result = await this.uploadMessage(message);
        if (result.success) {
          successCount++;
        }
      }

      return successCount;
    } catch (error) {
      console.error('Error retrying failed uploads:', error);
      return 0;
    }
  }

  async syncMessages(): Promise<{
    uploaded: number;
    failed: number;
    skipped: number;
  }> {
    try {
      const messages = await this.getMessages();
      const pendingMessages = messages.filter(msg => !msg.uploaded);

      let uploadedCount = 0;
      let failedCount = 0;

      console.log(
        `Starting sync of ${pendingMessages.length} pending messages`,
      );

      for (const message of pendingMessages) {
        const result = await this.uploadMessage(message);
        if (result.success) {
          uploadedCount++;
          console.log(`Successfully uploaded message: ${message.id}`);
        } else {
          failedCount++;
          console.log(
            `Failed to upload message: ${message.id}, Error: ${result.error}`,
          );
          message.uploadAttempts = (message.uploadAttempts || 0) + 1;
          await this.updateMessage(message);
        }
      }

      // Update last sync time
      await this.setLastSyncTime(Date.now());

      console.log(
        `Sync completed: ${uploadedCount} uploaded, ${failedCount} failed`,
      );
      return { uploaded: uploadedCount, failed: failedCount, skipped: 0 };
    } catch (error) {
      console.error('Error syncing messages:', error);
      return { uploaded: 0, failed: 0, skipped: 0 };
    }
  }

  private async logUpload(
    message: SMSMessage,
    success: boolean,
    error?: string,
  ): Promise<void> {
    try {
      const logs = await this.getUploadLogs();
      const logEntry = {
        id: Date.now().toString(),
        messageId: message.id,
        sender: message.sender,
        timestamp: Date.now(),
        success,
        error,
      };

      logs.unshift(logEntry);

      // Keep only last 10 logs
      if (logs.length > 10) {
        logs.splice(10);
      }

      await AsyncStorage.setItem(UPLOAD_LOGS_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging upload:', error);
    }
  }

  async getUploadLogs(): Promise<any[]> {
    try {
      const logsJson = await AsyncStorage.getItem(UPLOAD_LOGS_KEY);
      if (logsJson) {
        return JSON.parse(logsJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting upload logs:', error);
      return [];
    }
  }

  async clearData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        UPLOAD_LOGS_KEY,
        LAST_SYNC_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}
