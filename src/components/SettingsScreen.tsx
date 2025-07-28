import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SMSService } from '../services/SMSService';

interface SettingsScreenProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClose,
  isDarkMode = true,
}) => {
  const [serverUrl, setServerUrl] = useState('');
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const smsService = SMSService.getInstance();

  useEffect(() => {
    loadSettings();
    loadUploadLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const url = await smsService.getServerUrl();
      setServerUrl(url);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUploadLogs = async () => {
    try {
      const logs = await smsService.getUploadLogs();
      setUploadLogs(logs);
    } catch (error) {
      console.error('Error loading upload logs:', error);
    }
  };

  const saveServerUrl = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid server URL');
      return;
    }

    try {
      setIsLoading(true);
      await smsService.setServerUrl(serverUrl.trim());
      Alert.alert('Success', 'Server URL saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save server URL');
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = async () => {
    Alert.alert(
      'Clear Data',
      'Are you sure you want to clear all messages and logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await smsService.clearData();
              setUploadLogs([]);
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ],
    );
  };

  const formatLogTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Configuration</Text>
          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://10.0.2.2:8000"
            placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={saveServerUrl}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Saving...' : 'Save Server URL'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upload Logs (Last 10)</Text>
            <TouchableOpacity
              onPress={loadUploadLogs}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {uploadLogs.length === 0 ? (
            <Text style={styles.emptyText}>No upload logs available</Text>
          ) : (
            uploadLogs.map((log, index) => (
              <View key={log.id || index} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.logSender}>{log.sender}</Text>
                  <View
                    style={[
                      styles.logStatus,
                      { backgroundColor: log.success ? '#4CAF50' : '#FF5722' },
                    ]}
                  >
                    <Text style={styles.logStatusText}>
                      {log.success ? 'Success' : 'Failed'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logTimestamp}>
                  {formatLogTimestamp(log.timestamp)}
                </Text>
                {log.error && <Text style={styles.logError}>{log.error}</Text>}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={clearData}
          >
            <Text style={[styles.buttonText, styles.dangerButtonText]}>
              Clear All Data
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F5F5',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#3A3A3A' : '#E0E0E0',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#333333',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 18,
      color: isDarkMode ? '#FFFFFF' : '#666666',
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
      margin: 16,
      padding: 16,
      borderRadius: 12,
      elevation: isDarkMode ? 0 : 2,
      shadowColor: isDarkMode ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0 : 0.22,
      shadowRadius: isDarkMode ? 0 : 2.22,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      color: isDarkMode ? '#CCCCCC' : '#666666',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 16,
      backgroundColor: isDarkMode ? '#1A1A1A' : '#FAFAFA',
      color: isDarkMode ? '#FFFFFF' : '#333333',
    },
    button: {
      backgroundColor: '#4CAF50',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: isDarkMode ? '#444444' : '#CCCCCC',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    dangerButton: {
      backgroundColor: '#FF5722',
    },
    dangerButtonText: {
      color: '#FFFFFF',
    },
    refreshButton: {
      padding: 8,
    },
    refreshButtonText: {
      color: '#4CAF50',
      fontSize: 14,
    },
    emptyText: {
      textAlign: 'center',
      color: isDarkMode ? '#666666' : '#999999',
      fontStyle: 'italic',
      padding: 20,
    },
    logItem: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444444' : '#F0F0F0',
      paddingVertical: 8,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    logSender: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#333333',
    },
    logStatus: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    logStatusText: {
      color: '#FFFFFF',
      fontSize: 12,
    },
    logTimestamp: {
      fontSize: 12,
      color: isDarkMode ? '#999999' : '#999999',
      marginBottom: 4,
    },
    logError: {
      fontSize: 12,
      color: '#FF5722',
      fontStyle: 'italic',
    },
  });
