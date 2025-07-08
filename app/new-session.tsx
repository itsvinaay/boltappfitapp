import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  User,
  ChevronDown,
  Plus,
  X
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { Client, WorkoutTemplate } from '@/types/workout';
import { getClients, getTemplates } from '@/utils/storage';
import { createEnhancedTrainingSession } from '@/lib/trainerQueries';

export default function NewSessionScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('Gym A');
  
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedClients, loadedTemplates] = await Promise.all([
        getClients(),
        getTemplates()
      ]);
      setClients(loadedClients);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleScheduleSession = async () => {
    if (!selectedClient || !selectedTemplate) {
      Alert.alert('Error', 'Please select both a client and workout template');
      return;
    }

    setLoading(true);
    try {
      const sessionData = {
        client_id: selectedClient.id,
        scheduled_date: sessionDate,
        scheduled_time: sessionTime,
        duration_minutes: parseInt(duration),
        type: selectedTemplate.name, // or use a different field if you have session type
        location,
        notes,
      };

      const result = await createEnhancedTrainingSession(sessionData);

      if (result) {
        Alert.alert(
          'Success',
          'Session scheduled successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error scheduling session:', error);
      Alert.alert('Error', 'Failed to schedule session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Schedule New Session</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client Selection */}
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Client *</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowClientPicker(true)}
          >
            <Text style={[
              styles.pickerText,
              !selectedClient && styles.placeholderText
            ]}>
              {selectedClient ? selectedClient.name : 'Select a client'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Workout Template Selection */}
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Workout Template *</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowTemplatePicker(true)}
          >
            <Text style={[
              styles.pickerText,
              !selectedTemplate && styles.placeholderText
            ]}>
              {selectedTemplate ? selectedTemplate.name : 'Select a workout template'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Date and Time */}
        <View style={styles.formRow}>
          <View style={styles.formFieldHalf}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={sessionDate}
              onChangeText={setSessionDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formFieldHalf}>
            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              style={styles.textInput}
              value={sessionTime}
              onChangeText={setSessionTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Duration and Location */}
        <View style={styles.formRow}>
          <View style={styles.formFieldHalf}>
            <Text style={styles.fieldLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="60"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formFieldHalf}>
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Gym A"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Session Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any special instructions or notes for this session..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Session Preview */}
        {selectedClient && selectedTemplate && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Session Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Client:</Text>
              <Text style={styles.previewValue}>{selectedClient.name}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Workout:</Text>
              <Text style={styles.previewValue}>{selectedTemplate.name}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Date & Time:</Text>
              <Text style={styles.previewValue}>{sessionDate} at {sessionTime}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Duration:</Text>
              <Text style={styles.previewValue}>{duration} minutes</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Location:</Text>
              <Text style={styles.previewValue}>{location}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Schedule Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.scheduleButton,
            (!selectedClient || !selectedTemplate || loading) && styles.disabledButton
          ]}
          onPress={handleScheduleSession}
          disabled={!selectedClient || !selectedTemplate || loading}
        >
          <Text style={[
            styles.scheduleButtonText,
            (!selectedClient || !selectedTemplate || loading) && styles.disabledButtonText
          ]}>
            {loading ? 'Scheduling...' : 'Schedule Session'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Client Picker Modal */}
      <Modal
        visible={showClientPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity onPress={() => setShowClientPicker(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.clientList}>
            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={[
                  styles.clientOption,
                  selectedClient?.id === client.id && styles.selectedClientOption
                ]}
                onPress={() => {
                  setSelectedClient(client);
                  setShowClientPicker(false);
                }}
              >
                <Text style={styles.clientAvatar}>{client.avatar}</Text>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientEmail}>{client.email}</Text>
                </View>
                {selectedClient?.id === client.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Template Picker Modal */}
      <Modal
        visible={showTemplatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplatePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Workout Template</Text>
            <TouchableOpacity onPress={() => setShowTemplatePicker(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.templateList}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateOption,
                  selectedTemplate?.id === template.id && styles.selectedTemplateOption
                ]}
                onPress={() => {
                  setSelectedTemplate(template);
                  setShowTemplatePicker(false);
                }}
              >
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription}>
                    {template.exercises.length} exercises • {template.duration} min
                  </Text>
                  <Text style={styles.templateCategory}>{template.category}</Text>
                </View>
                {selectedTemplate?.id === template.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formField: {
    marginBottom: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scheduleButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.borderLight,
  },
  scheduleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: colors.textTertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  clientList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  selectedClientOption: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clientAvatar: {
    fontSize: 24,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  templateList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  templateOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTemplateOption: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  templateCategory: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
  },
});