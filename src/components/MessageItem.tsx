import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SMSMessage } from '../types';

interface MessageItemProps {
  message: SMSMessage;
  onRetry?: (message: SMSMessage) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRetry,
}) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = () => {
    if (message.uploaded) return '#4CAF50'; // Green
    if (message.uploadAttempts > 0) return '#FF5722'; // Red
    return '#FF9800'; // Orange (pending)
  };

  const getStatusText = () => {
    if (message.uploaded) return 'Uploaded';
    if (message.uploadAttempts > 0)
      return `Failed (${message.uploadAttempts} attempts)`;
    return 'Pending';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sender}>{message.sender}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
        >
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <Text style={styles.body} numberOfLines={3}>
        {message.body}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {formatTimestamp(message.timestamp)}
        </Text>
        {!message.uploaded && onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => onRetry(message)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sender: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999999',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
