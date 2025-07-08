import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Mail, Phone, Calendar, MapPin } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useUserRole } from '@/contexts/UserContext';

export default function ProfileSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { userName, setUserName } = useUserRole();

  const [profileData, setProfileData] = useState({
    name: userName,
    email: 'vinay@example.com',
    phone: '+1 234 567 8900',
    dateOfBirth: '1990-01-15',
    location: 'San Francisco, CA',
    bio: 'Fitness enthusiast and health coach passionate about helping others achieve their goals.',
  });

  const handleSave = () => {
    setUserName(profileData.name);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => console.log('Take photo') },
        { text: 'Choose from Gallery', onPress: () => console.log('Choose from gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Settings</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>VD</Text>
            </View>
            <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto}>
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoLabel}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={profileData.dateOfBirth}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, dateOfBirth: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={profileData.location}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, location: text }))}
                placeholder="Enter your location"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profileData.bio}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

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
  saveText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  photoLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});