import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Settings, 
  Calendar,
  Play,
  X,
  Clock,
  Dumbbell,
  RotateCcw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutTemplate, Exercise, TrainingSession, WorkoutSet } from '@/types/workout';
import { getWorkoutTemplateById } from '@/lib/planDatabase';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

interface ExerciseWithDetails extends Exercise {
  sets: number;
  reps: string;
  image: string;
}

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { workoutId } = useLocalSearchParams();

  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutDetails();
  }, []);

  const loadWorkoutDetails = async () => {
    try {
      console.log('🔍 Loading workout details for ID:', workoutId);
      
      if (!workoutId) {
        const errorMsg = 'No workout ID provided';
        console.error('❌ ' + errorMsg);
        Alert.alert('Error', 'Invalid workout reference. Please try again.');
        router.back();
        setLoading(false);
        return;
      }

      // Handle case where workoutId is a template ID (starts with 'template-')
      if (typeof workoutId === 'string' && workoutId.startsWith('template-')) {
        const templateId = workoutId.replace('template-', '');
        const { data: template, error: templateError } = await supabase
          .from('workout_templates')
          .select('*')
          .eq('id', templateId)
          .maybeSingle();
        
        if (templateError || !template) {
          console.error('❌ Error loading template:', {
            error: templateError,
            templateId,
            timestamp: new Date().toISOString()
          });
          Alert.alert('Error', 'Failed to load workout template. Please try again later.');
          router.back();
          setLoading(false);
          return;
        }
        
        // Get exercises for this template
        const { data: templateExercises, error: templateExercisesError } = await supabase
          .from('template_exercises')
          .select(`
            *,
            exercise:exercises(*)
          `)
          .eq('template_id', templateId)
          .order('order_index', { ascending: true });
        
        if (templateExercisesError) {
          console.error('❌ Error loading template exercises:', {
            error: templateExercisesError,
            templateId,
            timestamp: new Date().toISOString()
          });
          Alert.alert('Error', 'Failed to load workout template exercises. Please try again later.');
          router.back();
          setLoading(false);
          return;
        }
        
        const workoutTemplate: WorkoutTemplate = {
          ...template,
          exercises: (templateExercises || []).map((te: any) => ({
            id: te.id,
            template_id: templateId,
            exercise_id: te.exercise.id,
            exercise: te.exercise,
            order_index: te.order_index,
            sets_config: te.sets_config,
            notes: te.notes,
            created_at: te.created_at
          }))
        };
        
        setWorkout(workoutTemplate);
        setExercises(workoutTemplate.exercises.map((ex, idx) => ({
          ...ex.exercise,
          sets: 3, // Default value, adjust as needed
          reps: '8-12', // Default value, adjust as needed
          image: getExerciseImage(ex.exercise.name, idx),
        })));
        return;
      }
      
      // Handle case where workoutId is a training session ID
      let workoutTemplate = await getWorkoutTemplateById(workoutId as string);
      if (!workoutTemplate) {
        // Fallback: maybe workoutId refers to a training session; fetch and construct minimal template
        const { data: session, error: sessionError } = await supabase
          .from('training_sessions')
          .select('*, workout_templates(*)')
          .eq('id', workoutId as string)
          .maybeSingle();
        
        if (sessionError) {
          console.error('❌ Error loading training session:', {
            error: sessionError,
            workoutId,
            timestamp: new Date().toISOString()
          });
          Alert.alert('Error', 'Failed to load workout. Please try again later.');
          router.back();
          setLoading(false);
          return;
        }
        
        if (!session) {
          console.error('❌ Workout not found:', {
            workoutId,
            timestamp: new Date().toISOString()
          });
          Alert.alert('Error', 'Workout not found. Please try again later.');
          router.back();
          setLoading(false);
          return;
        }
        
        if (session.workout_templates) {
          workoutTemplate = session.workout_templates as WorkoutTemplate;
        } else {
          // construct simple template placeholder
          workoutTemplate = {
            id: session.id,
            name: session.session_type ?? 'Workout',
            description: session.notes ?? '',
            duration_minutes: session.duration ?? 0,
            exercises: [],
            equipment: [],
            created_at: session.created_at ?? '',
            updated_at: session.updated_at ?? ''
          } as unknown as WorkoutTemplate;
        }
      }

      if (workoutTemplate) {
        setWorkout(workoutTemplate);
        
        // Transform exercises with additional details
        const exercisesWithDetails: ExerciseWithDetails[] = workoutTemplate.exercises.map((templateExercise, index) => ({
          ...templateExercise.exercise,
          sets: templateExercise.sets.length,
          reps: templateExercise.sets.map((set: WorkoutSet) => set.reps).join(', '),
          image: getExerciseImage(templateExercise.exercise.name, index),
        }));
        
        setExercises(exercisesWithDetails);
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadWorkoutDetails:', {
        error,
        workoutId,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      Alert.alert('Error', 'An unexpected error occurred while loading workout details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getExerciseImage = (exerciseName: string, index: number): string => {
    // Use different Pexels images for different exercises
    const images = [
      'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=400',
    ];
    return images[index % images.length];
  };

  const handleStartWorkout = () => {
    if (workout) {
      router.push(`/start-workout/${workout.id}`);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
  };

  const handleMoveToToday = () => {
    setShowRescheduleModal(false);
    Alert.alert('Success', 'Workout moved to today!');
  };

  const renderExerciseItem = (exercise: ExerciseWithDetails, index: number) => (
    <TouchableOpacity key={exercise.id} style={styles.exerciseItem}>
      <View style={styles.exerciseImageContainer}>
        <Image source={{ uri: exercise.image }} style={styles.exerciseImage} />
        <View style={styles.exercisePlayButton}>
          <Play size={16} color="#FFFFFF" />
        </View>
      </View>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseDetails}>
          {exercise.reps} reps, {exercise.sets} reps, {exercise.reps} reps, {exercise.reps}...
        </Text>
      </View>
      
      <View style={styles.exerciseSets}>
        <Text style={styles.exerciseSetCount}>x{exercise.sets}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEquipmentItem = (equipment: string, index: number) => (
    <View key={index} style={styles.equipmentItem}>
      <Text style={styles.equipmentIcon}>
        {equipment === 'Barbell' ? '🏋️' : equipment === 'Dumbbell' ? '🏋️‍♀️' : '🔗'}
      </Text>
      <Text style={styles.equipmentName}>{equipment}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading workout details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Dumbbell size={48} color={colors.text} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Workout Not Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            The workout you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity 
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const equipment = ['Barbell', 'Cable Machine', 'Dumbbell'];

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Dumbbell size={48} color={colors.text} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Exercises Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            This workout doesn't have any exercises yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Section with Background Image */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <SafeAreaView style={styles.heroContent}>
            {/* Header */}
            <View style={styles.heroHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroActionButton}>
                  <RotateCcw size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionButton}>
                  <Settings size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Workout Info */}
            <View style={styles.heroInfo}>
              <Text style={styles.heroDate}>MONDAY, JUN 23</Text>
              <Text style={styles.heroTitle}>{workout.name}</Text>
              <TouchableOpacity style={styles.startWorkoutButton} onPress={handleStartWorkout}>
                <Text style={styles.startWorkoutText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Equipment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.equipmentList}>
            {equipment.map(renderEquipmentItem)}
          </View>
        </View>

        {/* Warm Up Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PHYSIQUE Dynamic Warm Up</Text>
          <TouchableOpacity style={styles.warmUpItem}>
            <View style={styles.warmUpImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.warmUpImage}
              />
              <View style={styles.warmUpPlayButton}>
                <Play size={16} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.warmUpInfo}>
              <Text style={styles.warmUpName}>Dynamic Warm Up Routine</Text>
              <Text style={styles.warmUpDuration}>1 round</Text>
            </View>
            <Text style={styles.warmUpCount}>x1</Text>
          </TouchableOpacity>
        </View>

        {/* Strength Training Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strength Training</Text>
          {exercises.map(renderExerciseItem)}
        </View>

        {/* Cool Down Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stretching & Cool Down</Text>
          <TouchableOpacity style={styles.coolDownItem}>
            <View style={styles.coolDownImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.coolDownImage}
              />
              <View style={styles.coolDownPlayButton}>
                <Play size={16} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.coolDownInfo}>
              <Text style={styles.coolDownName}>Post-Workout Stretches</Text>
              <Text style={styles.coolDownDuration}>1 round</Text>
            </View>
            <Text style={styles.coolDownCount}>x1</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Calendar size={32} color={colors.primary} />
            </View>
            
            <Text style={styles.modalTitle}>Workout reschedule</Text>
            <Text style={styles.modalMessage}>
              This workout is scheduled for Monday, Jun 23. Do you want to move the workout to today?
            </Text>
            
            <TouchableOpacity style={styles.modalButton} onPress={handleMoveToToday}>
              <Text style={styles.modalButtonText}>Move to today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRescheduleModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  // Existing styles...
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  heroSection: {
    height: height * 0.5,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 24,
    lineHeight: 38,
  },
  startWorkoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'flex-start',
  },
  startWorkoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  equipmentList: {
    flexDirection: 'row',
    gap: 16,
  },
  equipmentItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minWidth: 80,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  equipmentIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  equipmentName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  warmUpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  warmUpImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  warmUpImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  warmUpPlayButton: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warmUpInfo: {
    flex: 1,
  },
  warmUpName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  warmUpDuration: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  warmUpCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  exercisePlayButton: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseSets: {
    alignItems: 'center',
  },
  exerciseSetCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  coolDownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  coolDownImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  coolDownImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  coolDownPlayButton: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coolDownInfo: {
    flex: 1,
  },
  coolDownName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  coolDownDuration: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  coolDownCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 16,
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalCancelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});