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
  const [allowedSenders, setAllowedSenders] = useState<string[]>([]);
  const [newSender, setNewSender] = useState('');
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const smsService = SMSService.getInstance();

  useEffect(() => {
    loadSettings();
    loadAllowedSenders();
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

  const loadAllowedSenders = async () => {
    try {
      const senders = await smsService.getAllowedSenders();
      setAllowedSenders(senders);
    } catch (error) {
      console.error('Error loading allowed senders:', error);
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

  const addSender = async () => {
    if (!newSender.trim()) {
      Alert.alert('Error', 'Please enter a sender name');
      return;
    }

    const updatedSenders = [...allowedSenders, newSender.trim()];
    try {
      await smsService.setAllowedSenders(updatedSenders);
      setAllowedSenders(updatedSenders);
      setNewSender('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add sender');
    }
  };

  const removeSender = async (senderToRemove: string) => {
    const updatedSenders = allowedSenders.filter(
      sender => sender !== senderToRemove,
    );
    try {
      await smsService.setAllowedSenders(updatedSenders);
      setAllowedSenders(updatedSenders);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove sender');
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      await smsService.setServerUrl(serverUrl.trim());
      await smsService.setAllowedSenders(allowedSenders);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
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
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>P T</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Server URL Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server URL</Text>
          <Text style={styles.sectionDescription}>
            Messages will be forwarded to this endpoint.
          </Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="https://example.com/webhook"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Allowed Senders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allowed Senders</Text>
          <Text style={styles.sectionDescription}>
            Add senders you'd like the app to process.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.senderInput]}
              value={newSender}
              onChangeText={setNewSender}
              placeholder="Type sender ID"
              placeholderTextColor="#666666"
            />
            <TouchableOpacity onPress={addSender} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sendersContainer}>
            {allowedSenders.map((sender, index) => (
              <View key={index} style={styles.senderTag}>
                <Text style={styles.senderText}>{sender}</Text>
                <TouchableOpacity
                  onPress={() => removeSender(sender)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.buttonDisabled]}
          onPress={saveSettings}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : '💾 Save Settings'}
          </Text>
        </TouchableOpacity>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <View style={styles.sectionHeader}>
            <Text style={styles.subsectionTitle}>Upload Logs (Last 10)</Text>
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
      backgroundColor: '#2A2A2A',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#2A2A2A',
      paddingTop: 60, // Account for status bar
    },
    backButton: {
      padding: 8,
      width: 40,
    },
    backButtonText: {
      fontSize: 24,
      color: '#FFFFFF',
      fontWeight: '300',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      letterSpacing: 2,
    },
    placeholder: {
      width: 40, // Same width as back button for centering
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      backgroundColor: '#1E1E1E',
      marginBottom: 16,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#3A3A3A',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: '#CCCCCC',
      marginBottom: 16,
      lineHeight: 20,
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    input: {
      borderWidth: 1,
      borderColor: '#444444',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      backgroundColor: '#2A2A2A',
      color: '#FFFFFF',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    senderInput: {
      flex: 1,
      marginRight: 12,
      marginBottom: 0,
    },
    addButton: {
      backgroundColor: '#6366F1',
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '600',
    },
    sendersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    senderTag: {
      backgroundColor: '#3A3A3A',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    senderText: {
      color: '#FFFFFF',
      fontSize: 14,
      marginRight: 8,
    },
    removeButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FF5722',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    saveButton: {
      backgroundColor: '#6366F1',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    button: {
      backgroundColor: '#4CAF50',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    buttonDisabled: {
      backgroundColor: '#444444',
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
      color: '#6366F1',
      fontSize: 14,
    },
    emptyText: {
      textAlign: 'center',
      color: '#666666',
      fontStyle: 'italic',
      padding: 20,
    },
    logItem: {
      borderBottomWidth: 1,
      borderBottomColor: '#444444',
      paddingVertical: 12,
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
      color: '#FFFFFF',
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
      color: '#999999',
      marginBottom: 4,
    },
    logError: {
      fontSize: 12,
      color: '#FF5722',
      fontStyle: 'italic',
    },
  });
