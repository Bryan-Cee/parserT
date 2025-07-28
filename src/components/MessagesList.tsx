import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SMSMessage } from '../types';
import { MessageCard } from './MessageCard';

interface MessagesListProps {
  messages: SMSMessage[];
  refreshing: boolean;
  onRefresh: () => void;
  onMessagePress: (message: SMSMessage) => void;
}

export const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  refreshing,
  onRefresh,
  onMessagePress,
}) => {
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No messages yet</Text>
    </View>
  );

  const renderMessageItem = ({ item }: { item: SMSMessage }) => (
    <MessageCard message={item} onPress={onMessagePress} />
  );

  return (
    <View style={styles.messagesSection}>
      <Text style={styles.sectionTitle}>Recent Messages</Text>

      <FlatList
        data={messages}
        renderItem={renderMessageItem}
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
  );
};

const styles = StyleSheet.create({
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
