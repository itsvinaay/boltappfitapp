import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, MessageSquare, Send, Phone, Video, MoreHorizontal } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const conversations = [
  {
    id: 1,
    client: {
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      status: 'online'
    },
    lastMessage: {
      text: 'Thanks for the workout plan! Looking forward to tomorrow\'s session.',
      time: '2 min ago',
      sender: 'client',
      unread: false
    },
    unreadCount: 0
  },
  {
    id: 2,
    client: {
      name: 'Mike Chen',
      avatar: '👨‍💻',
      status: 'offline'
    },
    lastMessage: {
      text: 'Can we reschedule tomorrow\'s session to 3 PM?',
      time: '15 min ago',
      sender: 'client',
      unread: true
    },
    unreadCount: 2
  },
  {
    id: 3,
    client: {
      name: 'Emma Wilson',
      avatar: '👩‍🎨',
      status: 'offline'
    },
    lastMessage: {
      text: 'Perfect! I\'ll see you then.',
      time: '1 hour ago',
      sender: 'trainer',
      unread: false
    },
    unreadCount: 0
  },
  {
    id: 4,
    client: {
      name: 'David Lee',
      avatar: '👨‍🎯',
      status: 'online'
    },
    lastMessage: {
      text: 'Quick question about the nutrition plan...',
      time: '2 hours ago',
      sender: 'client',
      unread: true
    },
    unreadCount: 1
  }
];

export default function TrainerMessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const handleConversationPress = (conversation: any) => {
    router.push(`/chat/${conversation.id}`);
  };

  const renderConversationItem = (conversation: any) => (
    <TouchableOpacity 
      key={conversation.id} 
      style={styles.conversationItem}
      onPress={() => handleConversationPress(conversation)}
    >
      <View style={styles.conversationLeft}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{conversation.client.avatar}</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: conversation.client.status === 'online' ? colors.success : colors.textTertiary }
          ]} />
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.clientName}>{conversation.client.name}</Text>
            <Text style={styles.messageTime}>{conversation.lastMessage.time}</Text>
          </View>
          <View style={styles.messagePreview}>
            <Text 
              style={[
                styles.lastMessage,
                conversation.lastMessage.unread && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {conversation.lastMessage.sender === 'trainer' ? 'You: ' : ''}{conversation.lastMessage.text}
            </Text>
            {conversation.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.conversationActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Phone size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Video size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{conversations.length}</Text>
          <Text style={styles.statLabel}>Total Chats</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalUnread}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{conversations.filter(c => c.client.status === 'online').length}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No conversations found</Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search' 
                : 'Start chatting with your clients'}
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {filteredConversations.map(renderConversationItem)}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  headerBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  conversationsList: {
    paddingHorizontal: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  conversationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 24,
    width: 44,
    height: 44,
    textAlign: 'center',
    lineHeight: 44,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  conversationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});