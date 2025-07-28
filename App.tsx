import React, { useState, useCallback } from 'react';
import type { FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSMSPermissions, useSMSMessages } from './src/hooks/useSMS';
import { MessageItem } from './src/components/MessageItem';
import { SettingsScreen } from './src/components/SettingsScreen';
import { SMSMessage } from './src/types';
import { SMSService } from './src/services/SMSService';

const App: FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    permissionStatus,
    isLoading: permissionsLoading,
    requestPermissions,
  } = useSMSPermissions();
  const {
    messages,
    isLoading: messagesLoading,
    loadMessages,
    retryFailedUploads,
    readRecentSMS,
  } = useSMSMessages();

  const smsService = SMSService.getInstance();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }, [loadMessages]);

  const handleRetryMessage = useCallback(
    async (message: SMSMessage) => {
      try {
        const result = await smsService.uploadMessage(message);
        if (result.success) {
          Alert.alert('Success', 'Message uploaded successfully');
        } else {
          Alert.alert(
            'Upload Failed',
            result.error || 'Unknown error occurred',
          );
        }
        await loadMessages(); // Refresh the list
      } catch (error) {
        Alert.alert('Error', 'Failed to retry upload');
      }
    },
    [smsService, loadMessages],
  );

  const handleReadRecentSMS = useCallback(async () => {
    try {
      await readRecentSMS();
      Alert.alert('Success', 'Recent SMS messages have been read and processed');
    } catch (error) {
      Alert.alert('Error', 'Failed to read recent SMS messages');
    }
  }, [readRecentSMS]);

  const handleRetryAll = useCallback(async () => {
    try {
      const successCount = await retryFailedUploads();
      Alert.alert(
        'Retry Complete',
        `${successCount} messages uploaded successfully`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to retry uploads');
    }
  }, [retryFailedUploads]);

  const renderPermissionRequest = () => (
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
          onPress={requestPermissions}
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>parserT</Text>
        <Text style={styles.headerSubtitle}>
          {messages.length} messages • {messages.filter(m => m.uploaded).length}{' '}
          uploaded
        </Text>
      </View>
      <View style={styles.headerRight}>
        {messages.some(m => !m.uploaded) && (
          <TouchableOpacity
            onPress={handleRetryAll}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Retry All</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleReadRecentSMS}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>Read SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptyText}>
        SMS messages from banks and mobile money services will appear here
        automatically.
      </Text>
      <Text style={styles.emptyHint}>
        Whitelisted senders: M-PESA, Safaricom, Banks, etc.
      </Text>
    </View>
  );

  const renderMessage = ({ item }: { item: SMSMessage }) => (
    <MessageItem message={item} onRetry={handleRetryMessage} />
  );

  if (showSettings) {
    return <SettingsScreen onClose={() => setShowSettings(false)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {!permissionStatus.hasAllPermissions ? (
        renderPermissionRequest()
      ) : (
        <>
          {renderHeader()}

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messagesList}
            contentContainerStyle={
              messages.length === 0 ? styles.emptyListContainer : undefined
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  permissionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333333',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    color: '#666666',
  },
  permissionsList: {
    marginBottom: 32,
  },
  permissionItem: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionItemText: {
    fontSize: 16,
    color: '#333333',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
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
    color: '#666666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight
          ? StatusBar.currentHeight + 16
          : 40
        : 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default App;
