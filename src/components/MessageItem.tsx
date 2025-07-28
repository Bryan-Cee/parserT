import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SMSMessage } from '../types';

interface MessageItemProps {
  message: SMSMessage;
  onRetry?: (message: SMSMessage) => void;
  isDarkMode?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRetry,
  isDarkMode = false,
}) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const extractAmount = (body: string) => {
    // Extract amount from SMS body - looking for patterns like ₹650, $200, etc.
    const amountPattern = /(?:₹|Ksh|Rs\.?|USD|$)\s?([0-9,]+(?:\.[0-9]{2})?)/i;
    const match = body.match(amountPattern);
    return match ? match[0] : null;
  };

  const getTransactionType = (body: string) => {
    const lowerBody = body.toLowerCase();
    if (
      lowerBody.includes('sent') ||
      lowerBody.includes('paid') ||
      lowerBody.includes('debit')
    ) {
      return 'sent';
    } else if (
      lowerBody.includes('received') ||
      lowerBody.includes('credited') ||
      lowerBody.includes('credit')
    ) {
      return 'received';
    }
    return 'other';
  };

  const getStatusBadge = () => {
    if (message.uploaded) {
      return { text: 'Parsed', color: '#4CAF50' };
    }
    return { text: 'Pending', color: '#FF9800' };
  };

  const getTransactionDescription = (body: string) => {
    // Extract meaningful description from SMS
    const lines = body.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (
        line.toLowerCase().includes('to ') ||
        line.toLowerCase().includes('from ') ||
        line.toLowerCase().includes('at ')
      ) {
        return line.trim();
      }
    }
    return lines[0]?.trim() || body.substring(0, 50) + '...';
  };

  const amount = extractAmount(message.body);
  const transactionType = getTransactionType(message.body);
  const description = getTransactionDescription(message.body);
  const status = getStatusBadge();

  const styles = getStyles(isDarkMode);

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💬</Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.header}>
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text
            style={[
              styles.amount,
              transactionType === 'received'
                ? styles.positiveAmount
                : styles.negativeAmount,
            ]}
          >
            {amount || 'N/A'}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(message.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    leftSection: {
      marginRight: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#3A3A3A' : '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      fontSize: 20,
    },
    contentSection: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#FFFFFF' : '#333333',
      flex: 1,
      marginRight: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    amountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    amount: {
      fontSize: 18,
      fontWeight: '600',
    },
    positiveAmount: {
      color: '#4CAF50',
    },
    negativeAmount: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
    },
    timestamp: {
      fontSize: 14,
      color: isDarkMode ? '#999999' : '#666666',
    },
  });
