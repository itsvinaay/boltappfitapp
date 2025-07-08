import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Footprints, Target, TrendingUp, Calendar, Award, Flame, Clock, MoveHorizontal as MoreHorizontal, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface StepData {
  date: string;
  steps: number;
  goal: number;
  calories: number;
  distance: number; // in km
  activeMinutes: number;
  hourlyData: number[]; // 24 hours
}

interface WeekData {
  weekStart: string;
  totalSteps: number;
  averageSteps: number;
  daysActive: number;
  totalCalories: number;
  totalDistance: number;
  dailyData: StepData[];
}

interface MonthData {
  month: string;
  year: number;
  totalSteps: number;
  averageSteps: number;
  daysActive: number;
  totalCalories: number;
  totalDistance: number;
  weeklyData: WeekData[];
}

// Sample data generation
const generateHourlyData = (totalSteps: number): number[] => {
  const hourlyData = new Array(24).fill(0);
  const peakHours = [7, 8, 12, 13, 17, 18, 19]; // Morning, lunch, evening
  
  let remainingSteps = totalSteps;
  
  // Distribute steps with higher concentration during peak hours
  peakHours.forEach(hour => {
    const steps = Math.floor(remainingSteps * (0.1 + Math.random() * 0.15));
    hourlyData[hour] = steps;
    remainingSteps -= steps;
  });
  
  // Distribute remaining steps randomly
  for (let i = 0; i < 24; i++) {
    if (!peakHours.includes(i) && remainingSteps > 0) {
      const steps = Math.floor(Math.random() * (remainingSteps * 0.1));
      hourlyData[i] = steps;
      remainingSteps -= steps;
    }
  }
  
  return hourlyData;
};

const generateSampleData = (): { daily: StepData[], weekly: WeekData[], monthly: MonthData[] } => {
  const today = new Date();
  const daily: StepData[] = [];
  const weekly: WeekData[] = [];
  const monthly: MonthData[] = [];
  
  // Generate daily data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const steps = i === 0 ? 0 : Math.floor(2000 + Math.random() * 8000); // Today has 0 steps
    const goal = 10000;
    const calories = Math.floor(steps * 0.04);
    const distance = parseFloat((steps * 0.0008).toFixed(2));
    const activeMinutes = Math.floor(steps / 100);
    const hourlyData = generateHourlyData(steps);
    
    daily.push({
      date: date.toISOString().split('T')[0],
      steps,
      goal,
      calories,
      distance,
      activeMinutes,
      hourlyData
    });
  }
  
  // Generate weekly data
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
    
    const weekDays = daily.slice(i * 7, (i + 1) * 7);
    const totalSteps = weekDays.reduce((sum, day) => sum + day.steps, 0);
    const averageSteps = Math.floor(totalSteps / 7);
    const daysActive = weekDays.filter(day => day.steps > 1000).length;
    const totalCalories = weekDays.reduce((sum, day) => sum + day.calories, 0);
    const totalDistance = weekDays.reduce((sum, day) => sum + day.distance, 0);
    
    weekly.push({
      weekStart: weekStart.toISOString().split('T')[0],
      totalSteps,
      averageSteps,
      daysActive,
      totalCalories,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      dailyData: weekDays
    });
  }
  
  // Generate monthly data
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const totalSteps = daily.reduce((sum, day) => sum + day.steps, 0);
  const averageSteps = Math.floor(totalSteps / 30);
  const daysActive = daily.filter(day => day.steps > 1000).length;
  const totalCalories = daily.reduce((sum, day) => sum + day.calories, 0);
  const totalDistance = daily.reduce((sum, day) => sum + day.distance, 0);
  
  monthly.push({
    month: monthStart.toLocaleDateString('en-US', { month: 'long' }),
    year: monthStart.getFullYear(),
    totalSteps,
    averageSteps,
    daysActive,
    totalCalories,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    weeklyData: weekly
  });
  
  return { daily, weekly, monthly };
};

export default function StepTrackerScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data] = useState(generateSampleData());
  const [animatedValue] = useState(new Animated.Value(0));

  const todayData = data.daily[data.daily.length - 1];
  const currentWeekData = data.weekly[data.weekly.length - 1];
  const currentMonthData = data.monthly[0];

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const getProgressPercentage = (steps: number, goal: number) => {
    return Math.min((steps / goal) * 100, 100);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const renderCircularProgress = (steps: number, goal: number) => {
    const percentage = getProgressPercentage(steps, goal);
    const circumference = 2 * Math.PI * 120;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
      <View style={styles.circularProgressContainer}>
        <View style={styles.circularProgress}>
          <View style={styles.progressRing}>
            <View style={styles.progressBackground} />
            <Animated.View 
              style={[
                styles.progressForeground,
                {
                  transform: [{
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${(percentage * 3.6)}deg`]
                    })
                  }]
                }
              ]} 
            />
          </View>
          <View style={styles.progressContent}>
            <Text style={styles.todayLabel}>TODAY</Text>
            <Animated.Text style={styles.stepsNumber}>
              {animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, steps],
              }).interpolate({
                inputRange: [0, steps],
                outputRange: ['0', formatNumber(steps)],
                extrapolate: 'clamp'
              })}
            </Animated.Text>
            <Text style={styles.goalText}>of {formatNumber(goal)} steps</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHourlyChart = (hourlyData: number[]) => {
    const maxSteps = Math.max(...hourlyData, 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Today's steps</Text>
        <View style={styles.chartContent}>
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisLabel}>{formatNumber(maxSteps)}</Text>
            <Text style={styles.yAxisLabel}>{formatNumber(Math.floor(maxSteps / 2))}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>
          <View style={styles.chartArea}>
            <View style={styles.chartBars}>
              {hourlyData.map((steps, index) => {
                const height = maxSteps > 0 ? (steps / maxSteps) * 100 : 0;
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.chartBar,
                      {
                        height: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, height],
                          extrapolate: 'clamp'
                        }),
                        backgroundColor: steps > 0 ? colors.primary : colors.borderLight
                      }
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.xAxisLabels}>
              <View style={styles.xAxisLabel}>
                <Sun size={16} color={colors.warning} />
                <Text style={styles.xAxisText}>6 AM</Text>
              </View>
              <Text style={styles.xAxisText}>12 PM</Text>
              <View style={styles.xAxisLabel}>
                <Text style={styles.xAxisText}>6 PM</Text>
                <Moon size={16} color={colors.info} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWeeklyChart = (weekData: WeekData) => {
    const maxSteps = Math.max(...weekData.dailyData.map(d => d.steps), 1);
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>This week's steps</Text>
        <View style={styles.weeklyChart}>
          {weekData.dailyData.map((day, index) => {
            const height = (day.steps / maxSteps) * 120;
            const isToday = day.date === todayData.date;
            
            return (
              <View key={index} style={styles.weeklyBarContainer}>
                <Animated.View
                  style={[
                    styles.weeklyBar,
                    {
                      height: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, height],
                        extrapolate: 'clamp'
                      }),
                      backgroundColor: isToday ? colors.warning : 
                                     day.steps >= day.goal ? colors.success : colors.primary
                    }
                  ]}
                />
                <Text style={[
                  styles.weeklyBarLabel,
                  isToday && styles.todayBarLabel
                ]}>
                  {days[index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthlyChart = (monthData: MonthData) => {
    const maxSteps = Math.max(...monthData.weeklyData.map(w => w.totalSteps), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>This month's weekly totals</Text>
        <View style={styles.monthlyChart}>
          {monthData.weeklyData.map((week, index) => {
            const height = (week.totalSteps / maxSteps) * 120;
            
            return (
              <View key={index} style={styles.monthlyBarContainer}>
                <Animated.View
                  style={[
                    styles.monthlyBar,
                    {
                      height: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, height],
                        extrapolate: 'clamp'
                      }),
                      backgroundColor: colors.primary
                    }
                  ]}
                />
                <Text style={styles.monthlyBarLabel}>W{index + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStatsCards = () => {
    let stats;
    
    switch (activeTab) {
      case 'day':
        stats = [
          { label: 'Calories', value: todayData.calories, unit: 'kcal', icon: Flame, color: colors.error },
          { label: 'Distance', value: todayData.distance, unit: 'km', icon: Target, color: colors.success },
          { label: 'Active Time', value: todayData.activeMinutes, unit: 'min', icon: Clock, color: colors.warning },
        ];
        break;
      case 'week':
        stats = [
          { label: 'Total Steps', value: currentWeekData.totalSteps, unit: '', icon: Footprints, color: colors.primary },
          { label: 'Daily Average', value: currentWeekData.averageSteps, unit: '', icon: TrendingUp, color: colors.success },
          { label: 'Active Days', value: currentWeekData.daysActive, unit: '/7', icon: Calendar, color: colors.warning },
        ];
        break;
      case 'month':
        stats = [
          { label: 'Total Steps', value: currentMonthData.totalSteps, unit: '', icon: Footprints, color: colors.primary },
          { label: 'Daily Average', value: currentMonthData.averageSteps, unit: '', icon: TrendingUp, color: colors.success },
          { label: 'Active Days', value: currentMonthData.daysActive, unit: '/30', icon: Award, color: colors.warning },
        ];
        break;
    }

    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <IconComponent size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>
                {formatNumber(stat.value)}{stat.unit}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAchievements = () => {
    const achievements = [
      { title: 'Goal Crusher', description: 'Reached daily goal 5 times this week', icon: '🏆', unlocked: true },
      { title: 'Early Bird', description: 'Most active before 9 AM', icon: '🌅', unlocked: true },
      { title: 'Weekend Warrior', description: 'Stay active on weekends', icon: '⚡', unlocked: false },
    ];

    return (
      <View style={styles.achievementsContainer}>
        <Text style={styles.achievementsTitle}>Achievements</Text>
        {achievements.map((achievement, index) => (
          <View key={index} style={[
            styles.achievementCard,
            !achievement.unlocked && styles.lockedAchievement
          ]}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementContent}>
              <Text style={[
                styles.achievementTitle,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.title}
              </Text>
              <Text style={[
                styles.achievementDescription,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.description}
              </Text>
            </View>
            {achievement.unlocked && (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedText}>✓</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Steps</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['day', 'week', 'month'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Progress Circle (Day view only) */}
        {activeTab === 'day' && renderCircularProgress(todayData.steps, todayData.goal)}

        {/* Charts */}
        {activeTab === 'day' && renderHourlyChart(todayData.hourlyData)}
        {activeTab === 'week' && renderWeeklyChart(currentWeekData)}
        {activeTab === 'month' && renderMonthlyChart(currentMonthData)}

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Achievements (Day view only) */}
        {activeTab === 'day' && renderAchievements()}

        {/* Weekly/Monthly Summary */}
        {activeTab !== 'day' && (
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.summaryTitle}>
                {activeTab === 'week' ? 'This Week' : 'This Month'}
              </Text>
              <Text style={styles.summarySteps}>
                {formatNumber(activeTab === 'week' ? currentWeekData.totalSteps : currentMonthData.totalSteps)}
              </Text>
              <Text style={styles.summarySubtitle}>Total Steps</Text>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {formatNumber(activeTab === 'week' ? currentWeekData.totalCalories : currentMonthData.totalCalories)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Calories</Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {(activeTab === 'week' ? currentWeekData.totalDistance : currentMonthData.totalDistance).toFixed(1)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>km</Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatValue}>
                    {activeTab === 'week' ? currentWeekData.daysActive : currentMonthData.daysActive}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Active Days</Text>
                </View>
              </View>
            </LinearGradient>
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  moreButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.text,
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  circularProgressContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  circularProgress: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  progressBackground: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 20,
    borderColor: colors.borderLight,
  },
  progressForeground: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 20,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  stepsNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: colors.text,
    marginBottom: 4,
  },
  goalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  chartContent: {
    flexDirection: 'row',
    height: 120,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: 12,
    width: 50,
  },
  yAxisLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    justifyContent: 'space-between',
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 2,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xAxisText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 10,
  },
  weeklyBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
    marginBottom: 8,
  },
  weeklyBarLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  todayBarLabel: {
    color: colors.warning,
  },
  monthlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 20,
  },
  monthlyBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  monthlyBar: {
    width: 32,
    borderRadius: 16,
    minHeight: 4,
    marginBottom: 8,
  },
  monthlyBarLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  achievementsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  achievementsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  achievementCard: {
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
  lockedAchievement: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lockedText: {
    color: colors.textTertiary,
  },
  unlockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  summarySteps: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});