import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

interface HomeServerCardProps {
  autoSyncEnabled: boolean;
  onAutoSyncToggle: (enabled: boolean) => void;
  lastSyncTime: number;
  formatLastSyncTime: (timestamp: number) => string;
}

export const HomeServerCard: React.FC<HomeServerCardProps> = ({
  autoSyncEnabled,
  onAutoSyncToggle,
  lastSyncTime,
  formatLastSyncTime,
}) => {
  return (
    <View style={styles.homeServerCard}>
      <View style={styles.homeServerHeader}>
        <Text style={styles.homeServerTitle}>Home Server</Text>
        <Switch
          value={autoSyncEnabled}
          onValueChange={onAutoSyncToggle}
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
};

const styles = StyleSheet.create({
  homeServerCard: {
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
});
