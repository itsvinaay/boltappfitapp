import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = 'https://whvxmwvsjdwfzkobaqzi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indodnhtd3ZzamR3Znprb2JhcXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NTI4NjYsImV4cCI6MjA1NDUyODg2Nn0.8XqdoDtfidC8km7Buo6ED3DM7hhFsDAu8wyLoQDbjXc';// Custom storage adapter for different platforms
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      return AsyncStorage.getItem(key);
    } else {
      // Use SecureStore for mobile
      return SecureStore.getItemAsync(key);
    }
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      return AsyncStorage.setItem(key, value);
    } else {
      // Use SecureStore for mobile
      return SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      return AsyncStorage.removeItem(key);
    } else {
      // Use SecureStore for mobile
      return SecureStore.deleteItemAsync(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const signUp = async (email: string, password: string, userData?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const updateProfile = async (updates: any) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  return { data, error };
};