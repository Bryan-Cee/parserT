import React, { useState, useCallback, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { useSMSPermissions, useSMSMessages } from './src/hooks/useSMS';
import { MessageItem } from './src/components/MessageItem';
import { SettingsScreen } from './src/components/SettingsScreen';
import { SMSMessage } from './src/types';
import { SMSService } from './src/services/SMSService';

const App: FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

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
    syncMessages,
    readRecentSMS,
  } = useSMSMessages();

  const smsService = SMSService.getInstance();

  const loadLastSyncTime = useCallback(async () => {
    try {
      const time = await smsService.getLastSyncTime();
      setLastSyncTime(time);
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  }, [smsService]);

  const formatLastSyncTime = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
      Alert.alert(
        'Success',
        'Recent SMS messages have been read and processed',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to read recent SMS messages');
    }
  }, [readRecentSMS]);

  const handleSync = useCallback(async () => {
    try {
      await syncMessages();
      await loadLastSyncTime(); // Refresh the last sync time display
    } catch (error) {
      Alert.alert('Error', 'Failed to sync messages');
    }
  }, [syncMessages, loadLastSyncTime]);

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

  // Load last sync time on component mount
  useEffect(() => {
    loadLastSyncTime();
  }, [loadLastSyncTime]);

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
      <View style={styles.headerTop}>
        <Text style={styles.logo}>P T</Text>
        <View style={styles.headerIcons}>
          <View style={styles.statusIndicator} />
          <TouchableOpacity onPress={handleSync} style={styles.iconButton}>
            <Text style={styles.syncIcon}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.iconButton}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHomeServer = () => (
    <View style={styles.homeServerSection}>
      <View style={styles.homeServerHeader}>
        <Text style={styles.homeServerTitle}>Home Server</Text>
        <Switch
          value={autoSyncEnabled}
          onValueChange={setAutoSyncEnabled}
          trackColor={{ false: '#3E3E3E', true: '#4CAF50' }}
          thumbColor={autoSyncEnabled ? '#FFFFFF' : '#CCCCCC'}
        />
      </View>
      <Text style={styles.lastSyncText}>
        Last sync: {formatLastSyncTime(lastSyncTime)}
      </Text>
      <Text style={styles.homeServerDescription}>
        Automatically upload new messages to your private server and mark them
        when parsed.
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No messages yet</Text>
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
      <StatusBar backgroundColor="#1A1A1A" barStyle="light-content" />

      {!permissionStatus.hasAllPermissions ? (
        renderPermissionRequest()
      ) : (
        <>
          {renderHeader()}
          {renderHomeServer()}

          <View style={styles.messagesSection}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>

            <FlatList
              data={messages}
              renderItem={({ item }) => (
                <MessageItem
                  message={item}
                  onRetry={handleRetryMessage}
                  isDarkMode={true}
                />
              )}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={
                messages.length === 0
                  ? styles.emptyListContainer
                  : styles.messagesListContent
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FFFFFF"
                  colors={['#4CAF50']}
                />
              }
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
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
  header: {
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight
          ? StatusBar.currentHeight + 16
          : 40
        : 50,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  syncIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  settingsIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  homeServerSection: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  homeServerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeServerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lastSyncText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  homeServerDescription: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
  },
  messagesSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default App;
