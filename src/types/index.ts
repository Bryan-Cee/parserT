export interface SMSMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
  uploaded: boolean;
  uploadAttempts: number;
}

export interface UploadResult {
  success: boolean;
  error?: string;
}

export interface PermissionStatus {
  receiveSMS: boolean;
  readSMS: boolean;
  hasAllPermissions: boolean;
}

export interface AppConfig {
  serverUrl: string;
  uploadEndpoint: string;
  whitelistedSenders: string[];
}
