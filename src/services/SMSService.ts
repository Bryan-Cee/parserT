import AsyncStorage from '@react-native-async-storage/async-storage';
import { SMSMessage, UploadResult } from '../types';

const STORAGE_KEY = 'sms_messages';
const UPLOAD_LOGS_KEY = 'upload_logs';
const SERVER_URL_KEY = 'server_url';

export class SMSService {
  private static instance: SMSService;
  private serverUrl: string = 'http://192.168.1.100:8000'; // Default server URL

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
      const failedMessages = messages.filter(m => !m.uploaded);
      let successCount = 0;

      for (const message of failedMessages) {
        const result = await this.uploadMessage(message);
        if (result.success) {
          successCount++;
        } else {
          message.uploadAttempts = (message.uploadAttempts || 0) + 1;
          await this.updateMessage(message);
        }
      }

      return successCount;
    } catch (error) {
      console.error('Error retrying failed uploads:', error);
      return 0;
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
      await AsyncStorage.multiRemove([STORAGE_KEY, UPLOAD_LOGS_KEY]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}
