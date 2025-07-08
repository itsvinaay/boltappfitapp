import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Calendar, Clock, Users, Filter, Search } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

const sessions = [
  {
    id: 1,
    client: 'Sarah Johnson',
    date: '2024-01-15',
    time: '10:00 AM',
    duration: 60,
    type: 'Strength Training',
    status: 'completed',
    location: 'Gym A'
  },
  {
    id: 2,
    client: 'Mike Chen',
    date: '2024-01-15',
    time: '2:00 PM',
    duration: 45,
    type: 'HIIT Session',
    status: 'scheduled',
    location: 'Studio B'
  },
  {
    id: 3,
    client: 'Emma Wilson',
    date: '2024-01-16',
    time: '9:00 AM',
    duration: 90,
    type: 'Personal Training',
    status: 'scheduled',
    location: 'Gym A'
  },
  {
    id: 4,
    client: 'David Lee',
    date: '2024-01-16',
    time: '3:00 PM',
    duration: 60,
    type: 'Strength Training',
    status: 'cancelled',
    location: 'Gym B'
  }
];

export default function TrainerSessionsView() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredSessions = sessions.filter(session => {
    if (selectedFilter === 'all') return true;
    return session.status === selectedFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'scheduled': return colors.primary;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const renderSessionCard = (session: any) => (
    <TouchableOpacity key={session.id} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTime}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.sessionTimeText}>{session.time}</Text>
          <Text style={styles.sessionDate}>{session.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
          <Text style={styles.statusText}>{session.status}</Text>
        </View>
      </View>
      
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionClient}>{session.client}</Text>
        <Text style={styles.sessionType}>{session.type}</Text>
        <View style={styles.sessionDetails}>
          <Text style={styles.sessionDetail}>📍 {session.location}</Text>
          <Text style={styles.sessionDetail}>⏱️ {session.duration} min</Text>
        </View>
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
        <Text style={styles.title}>Training Sessions</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'scheduled', 'completed', 'cancelled'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.activeFilterTabText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.filter(s => s.status === 'scheduled').length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.filter(s => s.status === 'completed').length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.filter(s => s.status === 'cancelled').length}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No sessions found</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? 'You haven\'t scheduled any sessions yet' 
                : `No ${selectedFilter} sessions found`}
            </Text>
          </View>
        ) : (
          filteredSessions.map(renderSessionCard)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
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
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  sessionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  sessionInfo: {
    gap: 4,
  },
  sessionClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  sessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  sessionDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
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
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
});