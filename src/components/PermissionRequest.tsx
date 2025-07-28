import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface PermissionStatus {
  hasAllPermissions: boolean;
  receiveSMS: boolean;
  readSMS: boolean;
}

interface PermissionRequestProps {
  permissionStatus: PermissionStatus;
  permissionsLoading: boolean;
  onRequestPermissions: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  permissionStatus,
  permissionsLoading,
  onRequestPermissions,
}) => {
  return (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionTitle}>SMS Permissions Required</Text>
      <Text style={styles.permissionText}>
        This app needs SMS permissions to automatically detect and upload
        messages from banks and mobile money services.
      </Text>

      <View style={styles.permissionsList}>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionItemText}>
            📱 Receive SMS: {permissionStatus.receiveSMS ? '✅' : '❌'}
          </Text>
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionItemText}>
            📖 Read SMS: {permissionStatus.readSMS ? '✅' : '❌'}
          </Text>
        </View>
      </View>

      {!permissionStatus.hasAllPermissions && (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={onRequestPermissions}
          disabled={permissionsLoading}
        >
          <Text style={styles.permissionButtonText}>
            {permissionsLoading ? 'Requesting...' : 'Grant Permissions'}
          </Text>
        </TouchableOpacity>
      )}

      {permissionStatus.hasAllPermissions && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ All permissions granted!</Text>
          <Text style={styles.successSubtext}>
            The app will now automatically detect and upload SMS messages.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    color: '#CCCCCC',
  },
  permissionsList: {
    marginBottom: 32,
  },
  permissionItem: {
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
});
