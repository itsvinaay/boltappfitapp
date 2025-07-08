import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/app/splash';

export default function LoginRedirect() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to main app
        router.replace('/(tabs)');
      } else {
        // User is not authenticated, redirect to welcome screen
        router.replace('/(auth)/welcome');
      }
    }
  }, [user, loading]);

  // Show custom splash screen while checking auth state
  return <SplashScreen />;
}