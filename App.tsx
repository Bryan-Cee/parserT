import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { View, StyleSheet, Alert, StatusBar, Animated } from 'react-native';

import { useSMSPermissions, useSMSMessages } from './src/hooks/useSMS';
import { SettingsScreen } from './src/components/SettingsScreen';
import { Header } from './src/components/Header';
import { HomeServerCard } from './src/components/HomeServerCard';
import { PermissionRequest } from './src/components/PermissionRequest';
import { MessagesList } from './src/components/MessagesList';
import { SMSMessage } from './src/types';
import { SMSService } from './src/services/SMSService';

const App: FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Animation values for home screen components
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  const listScaleAnim = useRef(new Animated.Value(0.95)).current;

  // Animation values for settings screen
  const settingsFadeAnim = useRef(new Animated.Value(0)).current;
  const settingsScaleAnim = useRef(new Animated.Value(0.95)).current;

  const {
    permissionStatus,
    isLoading: permissionsLoading,
    requestPermissions,
  } = useSMSPermissions();
  const { messages, loadMessages, syncMessages } = useSMSMessages();

  const smsService = SMSService.getInstance();

  // Animation functions
  const animateToSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const animateToHome = useCallback(() => {
    setShowSettings(false);
  }, []);

  const animateHomeComponentsIn = useCallback(() => {
    // Reset all fade and scale values
    headerFadeAnim.setValue(0);
    cardFadeAnim.setValue(0);
    listFadeAnim.setValue(0);
    headerScaleAnim.setValue(0.95);
    cardScaleAnim.setValue(0.95);
    listScaleAnim.setValue(0.95);

    // Stagger the fade-in and scale animations
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(headerScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(listFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(listScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    headerFadeAnim,
    cardFadeAnim,
    listFadeAnim,
    headerScaleAnim,
    cardScaleAnim,
    listScaleAnim,
  ]);

  const animateSettingsComponentsIn = useCallback(() => {
    // Reset settings animation values
    settingsFadeAnim.setValue(0);
    settingsScaleAnim.setValue(0.95);

    // Animate settings screen in
    Animated.parallel([
      Animated.timing(settingsFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(settingsScaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [settingsFadeAnim, settingsScaleAnim]);

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

  const handleSync = useCallback(async () => {
    try {
      await syncMessages();
      await loadLastSyncTime(); // Refresh the last sync time display
    } catch (error) {
      Alert.alert('Error', 'Failed to sync messages');
    }
  }, [syncMessages, loadLastSyncTime]);

  // Load last sync time on component mount
  useEffect(() => {
    loadLastSyncTime();
  }, [loadLastSyncTime]);

  // Animate home components in when not showing settings
  useEffect(() => {
    if (!showSettings) {
      animateHomeComponentsIn();
    }
  }, [showSettings, animateHomeComponentsIn]);

  // Animate settings components in when showing settings
  useEffect(() => {
    if (showSettings) {
      animateSettingsComponentsIn();
    }
  }, [showSettings, animateSettingsComponentsIn]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1A1A1A" barStyle="light-content" />

      {!permissionStatus.hasAllPermissions ? (
        <PermissionRequest
          permissionStatus={permissionStatus}
          permissionsLoading={permissionsLoading}
          onRequestPermissions={requestPermissions}
        />
      ) : (
        <View style={styles.container}>
          {/* Main Screen */}
          {!showSettings && (
            <View style={styles.screenContainer}>
              <Animated.View
                style={{
                  opacity: headerFadeAnim,
                  transform: [{ scale: headerScaleAnim }],
                }}
              >
                <Header onSync={handleSync} onSettings={animateToSettings} />
              </Animated.View>
              <Animated.View
                style={{
                  opacity: cardFadeAnim,
                  transform: [{ scale: cardScaleAnim }],
                }}
              >
                <HomeServerCard
                  autoSyncEnabled={autoSyncEnabled}
                  onAutoSyncToggle={setAutoSyncEnabled}
                  lastSyncTime={lastSyncTime}
                  formatLastSyncTime={formatLastSyncTime}
                />
              </Animated.View>
              <Animated.View
                style={{
                  opacity: listFadeAnim,
                  flex: 1,
                  transform: [{ scale: listScaleAnim }],
                }}
              >
                <MessagesList
                  messages={messages}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  onMessagePress={handleRetryMessage}
                />
              </Animated.View>
            </View>
          )}

          {/* Settings Screen */}
          {showSettings && (
            <View style={styles.screenContainer}>
              <Animated.View
                style={{
                  opacity: settingsFadeAnim,
                  transform: [{ scale: settingsScaleAnim }],
                  flex: 1,
                }}
              >
                <SettingsScreen onClose={animateToHome} />
              </Animated.View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;
