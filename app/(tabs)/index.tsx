
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useUserRole } from '@/contexts/UserContext';
import { useTodayDataNew } from '@/hooks/useTodayDataNew';

// Import the new data-driven components
import TodayClientViewNew from '@/components/today/TodayClientViewWithData';
import TodayTrainerViewWithData from '@/components/today/TodayTrainerViewNew';
import TodayNutritionistViewWithData from '@/components/today/TodayNutritionistViewWithData';
import TodayAdminViewWithData from '@/components/today/TodayAdminViewWithData';
import TodayClientViewWithData from '@/components/today/TodayClientViewWithData';

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const { userRole } = useUserRole();
  const { loading, error } = useTodayDataNew();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Unable to load data
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render appropriate view based on user role
  switch (userRole) {
    case 'client':
      return <TodayClientViewWithData />;
    case 'trainer':
      return <TodayTrainerViewWithData />;
    case 'nutritionist':
      return <TodayNutritionistViewWithData />;
    case 'admin':
    case 'hr':
      return <TodayAdminViewWithData />;
    default:
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Welcome to VinayFit
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Please complete your profile setup to continue.
            </Text>
          </View>
        </SafeAreaView>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});