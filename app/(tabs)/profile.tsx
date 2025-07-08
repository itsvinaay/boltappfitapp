import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Clock, Droplets, TrendingUp, Calendar,Star, Camera, ChartBar as BarChart3, Target, ChevronRight, Activity, LogOut, Footprints } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useUserRole } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';


// Import role-specific profile views
import ProfileClientView from '@/components/profile/ProfileClientView';
import ProfileTrainerView from '@/components/profile/ProfileTrainerView';
import ProfileNutritionistView from '@/components/profile/ProfileNutritionistView';
import ProfileAdminView from '@/components/profile/ProfileAdminView';
import ProfileHRView from '@/components/profile/ProfileHRView';

const { width } = Dimensions.get('window');

const weightData = [
  { date: '4/24', weight: 72 },
  { date: '5/6', weight: 71.5 },
  { date: '5/18', weight: 71 },
  { date: '5/30', weight: 70.5 },
  { date: '6/11', weight: 70 },
  { date: '6/22', weight: 69.5 },
];

export default function ProfileView() {
  // ✅ ALL HOOKS AT THE TOP - BEFORE ANY CONDITIONAL LOGIC
  const { user, signOut, loading } = useAuth();
  // const colorScheme = useColorScheme();
  // const colors = getColors(colorScheme);
    // const colors = getColors(colorScheme ?? 'light');
    const colorScheme = useColorScheme() ?? 'light';
    const colors = getColors(colorScheme);
  const { userRole, userName, setUserRole } = useUserRole();
  const [trainingMinutes] = useState(184);
  const [streakDays] = useState(0);
  const [currentWeight] = useState(69.5);
  const [goalWeight] = useState(68);
  const [rating] = useState(4.8);

  // 🟢 FIX: Always call createStyles(colors) before any early return
  const styles = createStyles(colors);
 

  // ✅ CONDITIONAL LOGIC AFTER ALL HOOKS
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#000', fontSize: 18 }}>Signing out...</Text>
      </View>
    );
  }

  // Compute userInitials and displayName as variables, not state, and always check for user
  const userInitials =
    (user?.user_metadata?.first_name?.[0]?.toUpperCase() || '') +
    (user?.user_metadata?.last_name?.[0]?.toUpperCase() || '') ||
    'VD';

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            signOut();
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 'steps',
      title: 'Steps',
      icon: Footprints,
      color: colors.success,
      onPress: () => router.push('/step-tracker'),
    },
    {
      id: 'activity',
      title: 'Activity history',
      icon: Activity,
      color: colors.primary,
      onPress: () => router.push('/activity-history'),
    },
    {
      id: 'exercises',
      title: 'Your exercises',
      icon: Target,
      color: colors.success,
      onPress: () => {},
    },
    {
      id: 'progress',
      title: 'Progress photo',
      icon: Camera,
      color: colors.warning,
      onPress: () => router.push('/progress-photo'),
    },
    // Add fitness goals menu item for clients
    ...(userRole === 'client' ? [{
      id: 'goals',
      title: 'Fitness Goals',
      icon: Target,
      color: colors.info,
      onPress: () => router.push('/fitness-goals'),
    }] : []),
    {
      id: 'logout',
      title: 'Logout',
      icon: LogOut,
      color: colors.error,
      onPress: handleLogout,
    },
  ];

  const renderWeightChart = () => {
    const maxWeight = Math.max(...weightData.map(d => d.weight));
    const minWeight = Math.min(...weightData.map(d => d.weight));
    const range = maxWeight - minWeight;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {weightData.map((point, index) => {
            const height = range > 0 ? ((point.weight - minWeight) / range) * 60 : 30;
            const x = (index / (weightData.length - 1)) * (width - 120);
            
            return (
              <View
                key={index}
                style={[
                  styles.chartPoint,
                  {
                    left: x,
                    bottom: height,
                  }
                ]}
              />
            );
          })}
          
          {/* Chart line */}
          <View style={styles.chartLine} />
        </View>
        
        <View style={styles.chartLabels}>
          {weightData.map((point, index) => (
            <Text key={index} style={styles.chartLabel}>
              {point.date}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>You</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
                    {userRole === 'trainer' && (
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
            )}
                  {userRole === 'hr' && (
            <LinearGradient
                     colors={colorScheme === 'dark' ? ['#059669', '#EC4899'] : ['#A8EDEA', '#FED6E3']}
                     style={styles.profileAvatar}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                   >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
            )}
                {userRole === 'admin' && (
             <LinearGradient
                       colors={colorScheme === 'dark' ? ['#DC2626', '#F59E0B'] : ['#FA709A', '#FEE140']}
                       style={styles.profileAvatar}
                       start={{ x: 0, y: 0 }}
                       end={{ x: 1, y: 1 }}
                     >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
            )}
                {userRole === 'nutritionist' && (
            <LinearGradient
            colors={colorScheme === 'dark' ? ['#0284C7', '#0891B2'] : ['#4FACFE', '#00F2FE']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
            )}
              {userRole === 'client' && (
           <LinearGradient
            colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>{userInitials}</Text>
          </LinearGradient>
            )}
            
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hi, {displayName}!</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {userRole === 'client' && ( 
            <Text style={styles.profileRole}>Role: {userRole}</Text>

            )}
            {userRole === 'hr' && ( 
            <Text style={styles.profileRole}>{userRole} Manager</Text>

            )}
            {userRole === 'trainer' && ( 
            <Text style={styles.profileRole}>Personal {userRole}</Text>
            )}
             {userRole === 'nutritionist' && ( 
            <Text style={styles.profileRole}>Certified {userRole}</Text>

            )}
            {userRole === 'admin' && ( 
            <Text style={styles.profileRole}>{userRole} Manager</Text>

            )}

          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>



            {userRole === 'trainer' && ( 
             <View style={styles.ratingContainer}>
                          <Star size={16} color={colors.warning} fill={colors.warning} />
                          <Text style={styles.ratingText}>{rating} rating</Text>
                        </View>

            )}

            {userRole === 'client' && (
              <TouchableOpacity 
                style={styles.goalButton}
                onPress={() => router.push('/set-fitness-goal')}
              >
                <Text style={styles.goalButtonText}>
                  Set your fitness goal <Text style={styles.goalButtonLink}>(add)</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        {/* </View> */}

<View >
        {(() => {
          switch (userRole) {
            case 'client':
              return <ProfileClientView />;
            case 'trainer':
              return <ProfileTrainerView />;
            case 'nutritionist':
              return <ProfileNutritionistView />;
            case 'admin':
              return <ProfileAdminView />;
            case 'hr':
              return <ProfileHRView />;
            default:
              return <ProfileClientView />;
          }
        })()}
      </View>
        {/* Stats Cards */}
        {/* <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Clock size={20} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{trainingMinutes}</Text>
            <Text style={styles.statLabel}>Training min</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
              <Droplets size={20} color={colors.info} />
            </View>
            <Text style={styles.statNumber}>{streakDays}</Text>
            <Text style={styles.statLabel}>Streak days</Text>
          </View>
        </View> */}

        {/* Metrics Section */}
        {/* <View style={styles.metricsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metrics</Text>
         <TouchableOpacity  onPress={() => router.push('/client-metrics')}>
              <Text style={styles.viewMoreText}>View more</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>WEIGHT (KG)</Text>
            
            <View style={styles.weightInfo}>
              <Text style={styles.currentWeight}>{currentWeight}</Text>
              <Text style={styles.weightProgress}>
                {currentWeight > goalWeight ? `${(currentWeight - goalWeight).toFixed(1)} kg to goal` : 'Goal reached!'}
              </Text>
            </View>
            
            {renderWeightChart()}
          </View>
        </View> */}


<View style={styles.menuSection}>
  {menuItems
    .filter(item => item.id === 'logout')
    .map((item) => {
      const IconComponent = item.icon;
      return (
        <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
          <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
            <IconComponent size={20} color={item.color} />
          </View>
          <Text style={styles.menuText}>{item.title}</Text>
          <ChevronRight size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      );
    })}
</View>
        
        {/* Menu Items */}
        {/* <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                  <IconComponent size={20} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
                <ChevronRight size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </View> */}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  profileRole: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
   ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  goalButton: {
    paddingVertical: 2,
  },
  goalButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  goalButtonLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  metricsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  viewMoreText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  metricsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  weightInfo: {
    marginBottom: 20,
  },
  currentWeight: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: colors.text,
  },
  weightProgress: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartContainer: {
    height: 100,
  },
  chartArea: {
    height: 80,
    position: 'relative',
    marginBottom: 8,
  },
  chartPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
    transform: [{ translateX: -3 }, { translateY: 3 }],
  },
  chartLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  chartLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.textTertiary,
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
});