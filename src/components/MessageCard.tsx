import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SMSMessage } from '../types';

interface MessageCardProps {
  message: SMSMessage;
  onPress: (message: SMSMessage) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  onPress,
}) => {
  const extractAmount = (body: string) => {
    // Extract amount from SMS body
    const patterns = [
      /(?:KES|Ksh|Rs\.?|USD|\$)\s?([0-9,]+(?:\.[0-9]{2})?)/i,
      /([0-9,]+(?:\.[0-9]{2})?)\s*(?:KES|Ksh|Rs\.?|USD|\$)/i,
      /amount.*?([0-9,]+(?:\.[0-9]{2})?)/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    return null;
  };

  const extractTitle = (body: string, sender: string) => {
    // Extract meaningful title from SMS body
    const lowerBody = body.toLowerCase();

    if (lowerBody.includes('swiggy')) return 'Paid to Swiggy';
    if (lowerBody.includes('amazon')) return 'Debit at AMAZON';
    if (lowerBody.includes('cafe')) return 'You spent at CAFE';
    if (lowerBody.includes('credited')) return 'Amount credited';
    if (lowerBody.includes('otp')) return 'OTP verification';

    // Fallback to first few words
    const words = body.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const formatTime = (timestamp: number) => {
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

  const amount = extractAmount(message.body);
  const title = extractTitle(message.body, message.sender);
  const isParsed = message.uploaded;

  return (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => onPress(message)}
    >
      <View style={styles.messageIcon}>
        <Text style={styles.messageIconText}>💬</Text>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageTitle}>{title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isParsed ? '#4CAF50' : '#FF9800' },
            ]}
          >
            <Text style={styles.statusText}>
              {isParsed ? 'Parsed' : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.messageAmount}>
            {amount ? `KES ${amount}` : 'No amount'}
          </Text>
          <Text style={styles.messageTime}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  messageIconText: {
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 65,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  messageAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999999',
  },
});
