import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Clock, Dumbbell, Target, Settings, RotateCcw, Heart, Share2, Download, Zap, TrendingUp, RefreshCw, Star, MoveVertical as MoreVertical, Volume2, VolumeX, Pause } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutTemplate, Exercise, WorkoutSet, TemplateExercise } from '@/types/workout';
import { getWorkoutTemplateById } from '@/lib/planDatabase';
import { formatDuration } from '@/utils/workoutUtils';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ExerciseWithDetails extends Exercise {
  sets: number;
  reps: string;
  image: string;
  video_url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  alternatives?: Exercise[];
  muscleGroups: string[];
  equipment: string[];
}

interface WorkoutProgress {
  completedExercises: string[];
  currentExercise: number;
  totalTime: number;
  startTime?: Date;
}

export default function TodaysWorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { templateId } = useLocalSearchParams();

  // Core state
  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([]);
  
  // New feature states
  const [isFavorite, setIsFavorite] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [progress, setProgress] = useState<WorkoutProgress>({
    completedExercises: [],
    currentExercise: 0,
    totalTime: 0,
  });
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState<string | null>(null);
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  // Performance optimization - memoized values
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => 
      difficulty === 'beginner' ? exercise.difficulty !== 'advanced' :
      difficulty === 'intermediate' ? true :
      exercise.difficulty === 'advanced'
    );
  }, [exercises, difficulty]);

  const workoutStats = useMemo(() => {
    const totalSets = filteredExercises.reduce((sum, ex) => sum + ex.sets, 0);
    const estimatedCalories = Math.round(filteredExercises.length * 15 * (difficulty === 'advanced' ? 1.3 : difficulty === 'intermediate' ? 1.1 : 1));
    const progressPercentage = progress.completedExercises.length / filteredExercises.length * 100;
    
    return { totalSets, estimatedCalories, progressPercentage };
  }, [filteredExercises, difficulty, progress.completedExercises]);

  useEffect(() => {
    loadWorkout();
    startAnimations();
  }, []);

  useEffect(() => {
    // Save progress to local storage
    if (workout) {
      // In a real app, you'd save to AsyncStorage or Supabase
      console.log('Saving progress:', progress);
    }
  }, [progress, workout]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const template = await getWorkoutTemplateById(templateId as string);
      if (template) {
        setWorkout(template);
        const exercisesWithDetails: ExerciseWithDetails[] = template.exercises.map((templateExercise, index) => ({
          ...templateExercise.exercise,
          sets: templateExercise.sets_config.length,
          reps: templateExercise.sets_config.map((set: WorkoutSet) => set.reps).filter(Boolean).join(', ') || '',
          image: getExerciseImage(templateExercise.exercise.name, index),
          video_url: templateExercise.exercise.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4',
          difficulty: getDifficultyLevel(templateExercise.exercise.name),
          alternatives: getExerciseAlternatives(templateExercise.exercise),
          muscleGroups: getMuscleGroups(templateExercise.exercise.category),
          equipment: getRequiredEquipment(templateExercise.exercise.name),
        }));
        setExercises(exercisesWithDetails);
        
        // Load saved progress and favorites
        await loadSavedData(template.id);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Error', 'Failed to load workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedData = async (workoutId: string) => {
    try {
      // In a real app, load from AsyncStorage or Supabase
      // const savedProgress = await AsyncStorage.getItem(`workout_progress_${workoutId}`);
      // const savedFavorites = await AsyncStorage.getItem('favorite_workouts');
      
      // Mock data for demo
      setIsFavorite(Math.random() > 0.5);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const getExerciseImage = (exerciseName: string, index: number): string => {
    const images = [
      'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400',
    ];
    return images[index % images.length];
  };

  const getDifficultyLevel = (exerciseName: string): 'beginner' | 'intermediate' | 'advanced' => {
    const advanced = ['deadlift', 'squat', 'bench press', 'overhead press'];
    const beginner = ['pushup', 'plank', 'wall sit', 'bodyweight'];
    
    const name = exerciseName.toLowerCase();
    if (advanced.some(ex => name.includes(ex))) return 'advanced';
    if (beginner.some(ex => name.includes(ex))) return 'beginner';
    return 'intermediate';
  };

  const getExerciseAlternatives = (exercise: Exercise): Exercise[] => {
    // Mock alternatives - in real app, fetch from database
    return [
      { ...exercise, name: `${exercise.name} (Modified)`, id: `${exercise.id}_alt1` },
      { ...exercise, name: `${exercise.name} (Beginner)`, id: `${exercise.id}_alt2` },
    ];
  };

  const getMuscleGroups = (category: string): string[] => {
    const muscleMap: { [key: string]: string[] } = {
      'chest': ['Pectorals', 'Anterior Deltoids', 'Triceps'],
      'back': ['Latissimus Dorsi', 'Rhomboids', 'Biceps'],
      'legs': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
      'shoulders': ['Deltoids', 'Trapezius', 'Rotator Cuff'],
      'arms': ['Biceps', 'Triceps', 'Forearms'],
      'core': ['Rectus Abdominis', 'Obliques', 'Transverse Abdominis'],
    };
    return muscleMap[category.toLowerCase()] || ['Full Body'];
  };

  const getRequiredEquipment = (exerciseName: string): string[] => {
    const name = exerciseName.toLowerCase();
    if (name.includes('barbell')) return ['Barbell', 'Weight Plates'];
    if (name.includes('dumbbell')) return ['Dumbbells'];
    if (name.includes('cable')) return ['Cable Machine'];
    if (name.includes('bodyweight') || name.includes('pushup') || name.includes('plank')) return ['None'];
    return ['Dumbbells']; // Default
  };

  const handleStartWorkout = () => {
    triggerHaptic();
    if (workout) {
      setProgress(prev => ({
        ...prev,
        startTime: new Date(),
      }));
      router.push(`/start-workout/${workout.id}`);
    }
  };

  const handleFavoriteToggle = async () => {
    triggerHaptic();
    setIsFavorite(!isFavorite);
    
    // In real app, save to AsyncStorage or Supabase
    try {
      // await AsyncStorage.setItem('favorite_workouts', JSON.stringify(updatedFavorites));
      Alert.alert(
        isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
        isFavorite ? 'Workout removed from your favorites' : 'Workout added to your favorites'
      );
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const handleShare = async () => {
    triggerHaptic();
    try {
      const message = `Check out this workout: ${workout?.name}\n${filteredExercises.length} exercises • ${workout?.estimated_duration_minutes} minutes\n\nDownload the app to try it!`;
      
      await Share.share({
        message,
        title: workout?.name || 'Workout',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownloadOffline = async () => {
    triggerHaptic();
    setIsOfflineMode(true);
    
    // Mock download process
    Alert.alert(
      'Download Started',
      'Workout is being downloaded for offline use...',
      [
        {
          text: 'OK',
          onPress: () => {
            setTimeout(() => {
              Alert.alert('Download Complete', 'Workout is now available offline!');
            }, 2000);
          }
        }
      ]
    );
  };

  const handleExerciseComplete = (exerciseId: string) => {
    triggerHaptic();
    setProgress(prev => ({
      ...prev,
      completedExercises: [...prev.completedExercises, exerciseId],
      currentExercise: prev.currentExercise + 1,
    }));
  };

  const handleShowAlternatives = (exerciseId: string) => {
    triggerHaptic();
    setShowAlternatives(showAlternatives === exerciseId ? null : exerciseId);
  };

  const renderDifficultySelector = () => (
    <View style={styles.difficultySelector}>
      <Text style={styles.difficultySelectorTitle}>Difficulty Level</Text>
      <View style={styles.difficultyButtons}>
        {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.difficultyButton,
              difficulty === level && styles.difficultyButtonActive
            ]}
            onPress={() => {
              triggerHaptic();
              setDifficulty(level);
            }}
          >
            <Text style={[
              styles.difficultyButtonText,
              difficulty === level && styles.difficultyButtonTextActive
            ]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Workout Progress</Text>
        <Text style={styles.progressText}>
          {progress.completedExercises.length}/{filteredExercises.length} exercises
        </Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            { 
              width: `${workoutStats.progressPercentage}%`,
              opacity: fadeAnim,
            }
          ]} 
        />
      </View>
    </View>
  );

  const renderWorkoutStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Dumbbell size={20} color={colors.primary} />
        <Text style={styles.statValue}>{workoutStats.totalSets}</Text>
        <Text style={styles.statLabel}>Total Sets</Text>
      </View>
      <View style={styles.statItem}>
        <Zap size={20} color={colors.warning} />
        <Text style={styles.statValue}>{workoutStats.estimatedCalories}</Text>
        <Text style={styles.statLabel}>Est. Calories</Text>
      </View>
      <View style={styles.statItem}>
        <TrendingUp size={20} color={colors.success} />
        <Text style={styles.statValue}>{Math.round(workoutStats.progressPercentage)}%</Text>
        <Text style={styles.statLabel}>Complete</Text>
      </View>
    </View>
  );

  const renderEquipmentItem = (equipment: string, index: number) => (
    <Animated.View 
      key={index} 
      style={[
        styles.equipmentItem,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }]
        }
      ]}
    >
      <Text style={styles.equipmentIcon}>
        {equipment === 'Barbell' ? '🏋️' : 
         equipment === 'Dumbbells' ? '🏋️‍♀️' : 
         equipment === 'Cable Machine' ? '🔗' : 
         equipment === 'None' ? '💪' : '🏋️'}
      </Text>
      <Text style={styles.equipmentName}>{equipment}</Text>
    </Animated.View>
  );

  const renderExerciseItem = (exercise: ExerciseWithDetails, index: number) => {
    const isCompleted = progress.completedExercises.includes(exercise.id);
    const showingAlternatives = showAlternatives === exercise.id;

    return (
      <Animated.View
        key={exercise.id}
        style={[
          styles.exerciseItem,
          isCompleted && styles.exerciseItemCompleted,
          {
            opacity: fadeAnim,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.exerciseContent}
          onPress={() => router.push({
            pathname: `/exercise-video/${exercise.id}`,
            params: { videoUrl: exercise.video_url, exerciseName: exercise.name }
          })}
          activeOpacity={0.7}
        >
          <View style={styles.exerciseImageContainer}>
            <Image 
              source={{ uri: exercise.image }} 
              style={styles.exerciseImage}
              onLoad={() => setHeroImageLoaded(true)}
            />
            <View style={styles.exercisePlayButton}>
              <Play size={16} color="#FFFFFF" />
            </View>
            {isCompleted && (
              <View style={styles.exerciseCompletedBadge}>
                <Text style={styles.exerciseCompletedText}>✓</Text>
              </View>
            )}
          </View>
          
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseDetails}>
              {exercise.reps} reps • {exercise.sets} sets
            </Text>
            <View style={styles.exerciseMeta}>
              <Text style={styles.exerciseCategory}>{exercise.category}</Text>
              <View style={styles.exerciseDifficulty}>
                <Text style={[
                  styles.exerciseDifficultyText,
                  { color: 
                    exercise.difficulty === 'beginner' ? colors.success :
                    exercise.difficulty === 'intermediate' ? colors.warning :
                    colors.error
                  }
                ]}>
                  {exercise.difficulty}
                </Text>
              </View>
            </View>
            <View style={styles.muscleGroups}>
              {exercise.muscleGroups.slice(0, 2).map((muscle, idx) => (
                <Text key={idx} style={styles.muscleGroupTag}>{muscle}</Text>
              ))}
            </View>
          </View>
          
          <View style={styles.exerciseActions}>
            <TouchableOpacity
              style={styles.exerciseActionButton}
              onPress={() => handleShowAlternatives(exercise.id)}
            >
              <RefreshCw size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exerciseActionButton}
              onPress={() => handleExerciseComplete(exercise.id)}
              disabled={isCompleted}
            >
              <Text style={[
                styles.exerciseSetCount,
                isCompleted && styles.exerciseSetCountCompleted
              ]}>
                {isCompleted ? '✓' : `x${exercise.sets}`}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {showingAlternatives && exercise.alternatives && (
          <Animated.View style={styles.alternativesContainer}>
            <Text style={styles.alternativesTitle}>Alternative Exercises:</Text>
            {exercise.alternatives.map((alt, altIndex) => (
              <TouchableOpacity key={altIndex} style={styles.alternativeItem}>
                <Text style={styles.alternativeName}>{alt.name}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const equipment = Array.from(new Set(filteredExercises.flatMap(ex => ex.equipment)));

  return (
    <View style={styles.container}>
      {/* Enhanced Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: workout.image_url || 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
          onLoad={() => setHeroImageLoaded(true)}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <SafeAreaView style={styles.heroContent}>
            {/* Enhanced Header */}
            <View style={styles.heroHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity 
                  style={styles.heroActionButton}
                  onPress={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 size={20} color="#FFFFFF" /> : <VolumeX size={20} color="#FFFFFF" />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionButton} onPress={handleShare}>
                  <Share2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionButton} onPress={handleDownloadOffline}>
                  <Download size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionButton} onPress={handleFavoriteToggle}>
                  <Heart size={20} color={isFavorite ? "#FF6B6B" : "#FFFFFF"} fill={isFavorite ? "#FF6B6B" : "transparent"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Enhanced Workout Info */}
            <Animated.View style={[styles.heroInfo, { opacity: fadeAnim }]}>
              <Text style={styles.heroDate}>TODAY'S WORKOUT</Text>
              <Text style={styles.heroTitle}>{workout.name}</Text>
              <View style={styles.heroMeta}>
                <View style={styles.heroMetaItem}>
                  <Dumbbell size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.heroMetaText}>{filteredExercises.length} exercises</Text>
                </View>
                <View style={styles.heroMetaItem}>
                  <Clock size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.heroMetaText}>{workout.estimated_duration_minutes} min</Text>
                </View>
                <View style={styles.heroMetaItem}>
                  <Target size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.heroMetaText}>{workout.category}</Text>
                </View>
                <View style={styles.heroMetaItem}>
                  <Zap size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.heroMetaText}>{workoutStats.estimatedCalories} cal</Text>
                </View>
              </View>
              
              {progress.completedExercises.length > 0 && renderProgressBar()}
              
              <TouchableOpacity style={styles.startWorkoutButton} onPress={handleStartWorkout}>
                <Play size={20} color={colors.text} />
                <Text style={styles.startWorkoutText}>
                  {progress.completedExercises.length > 0 ? 'Continue Workout' : 'Start Workout'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workout Stats */}
        {renderWorkoutStats()}

        {/* Difficulty Selector */}
        {renderDifficultySelector()}

        {/* Equipment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Needed</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.equipmentList}>
              {equipment.map(renderEquipmentItem)}
            </View>
          </ScrollView>
        </View>

        {/* Warm Up Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dynamic Warm Up</Text>
          <Animated.View style={[styles.warmUpItem, { opacity: fadeAnim }]}>
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
              <Text style={styles.warmUpDuration}>5-10 minutes • Prepare your body</Text>
            </View>
            <Text style={styles.warmUpCount}>x1</Text>
          </Animated.View>
        </View>

        {/* Main Workout Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Main Workout</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredExercises.length} exercises • {difficulty} level
            </Text>
          </View>
          {filteredExercises.map(renderExerciseItem)}
        </View>

        {/* Cool Down Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stretching & Cool Down</Text>
          <Animated.View style={[styles.coolDownItem, { opacity: fadeAnim }]}>
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
              <Text style={styles.coolDownDuration}>5-10 minutes • Recovery & flexibility</Text>
            </View>
            <Text style={styles.coolDownCount}>x1</Text>
          </Animated.View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Enhanced Floating Start Button */}
      <BlurView intensity={80} style={styles.floatingButtonContainer}>
        <TouchableOpacity 
          style={styles.floatingStartButton} 
          onPress={handleStartWorkout}
          activeOpacity={0.8}
        >
          <Play size={24} color="#FFFFFF" />
          <Text style={styles.floatingStartText}>
            {progress.completedExercises.length > 0 ? 'Continue' : 'Start Workout'}
          </Text>
          {progress.completedExercises.length > 0 && (
            <View style={styles.progressIndicator}>
              <Text style={styles.progressIndicatorText}>
                {Math.round(workoutStats.progressPercentage)}%
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  heroSection: {
    height: height * 0.55,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 16,
    lineHeight: 38,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startWorkoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  difficultySelector: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  difficultySelectorTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary,
  },
  difficultyButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  difficultyButtonTextActive: {
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  equipmentList: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 20,
  },
  equipmentItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minWidth: 80,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    shadowOpacity: 0.1,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  exerciseItemCompleted: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  exerciseCompletedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseCompletedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
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
    marginBottom: 6,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  exerciseCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  exerciseDifficulty: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.surfaceSecondary,
  },
  exerciseDifficultyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  muscleGroups: {
    flexDirection: 'row',
    gap: 6,
  },
  muscleGroupTag: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseActions: {
    alignItems: 'center',
    gap: 8,
  },
  exerciseActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseSetCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  exerciseSetCountCompleted: {
    color: colors.success,
  },
  alternativesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  alternativesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  alternativeItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    marginBottom: 4,
  },
  alternativeName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
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
    shadowOpacity: 0.1,
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
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  floatingStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingStartText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  progressIndicator: {
    marginLeft: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressIndicatorText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});