import { supabase } from './supabase';
import { WorkoutTemplate } from '@/types/workout';

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration: number;
  exercises: any[];
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

// Get all workout templates
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workout templates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getWorkoutTemplates:', error);
    return [];
  }
};

// Get a specific workout template by ID
export const getWorkoutTemplate = async (id: string): Promise<WorkoutTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching workout template:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getWorkoutTemplate:', error);
    return null;
  }
};

// Create a new workout template
export const createWorkoutTemplate = async (template: Omit<WorkoutTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .insert({
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout template:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createWorkoutTemplate:', error);
    return null;
  }
};

// Update a workout template
export const updateWorkoutTemplate = async (id: string, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout template:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateWorkoutTemplate:', error);
    return null;
  }
};

// Delete a workout template
export const deleteWorkoutTemplate = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout template:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorkoutTemplate:', error);
    return false;
  }
};

// Initialize default workout templates
export const initializeDefaultTemplates = async (): Promise<void> => {
  try {
    // Check if templates already exist
    const { data: existingTemplates } = await supabase
      .from('workout_templates')
      .select('id')
      .limit(1);

    if (existingTemplates && existingTemplates.length > 0) {
      console.log('Workout templates already exist');
      return;
    }

    // Create default templates
    const defaultTemplates = [
      {
        name: 'Upper Body Strength',
        description: 'Focus on building upper body strength with compound movements',
        category: 'Strength',
        duration: 60,
        exercises: [
          {
            id: 'ex-1',
            name: 'Bench Press',
            sets: [
              { reps: 8, weight: 135, restTime: 120 },
              { reps: 8, weight: 135, restTime: 120 },
              { reps: 8, weight: 135, restTime: 120 }
            ],
            order: 1,
            notes: 'Focus on controlled movement'
          },
          {
            id: 'ex-2',
            name: 'Pull-ups',
            sets: [
              { reps: 8, restTime: 90 },
              { reps: 8, restTime: 90 },
              { reps: 8, restTime: 90 }
            ],
            order: 2,
            notes: 'Use assistance if needed'
          }
        ],
        created_by: 'system',
        is_public: true
      },
      {
        name: 'Lower Body Power',
        description: 'Build explosive lower body strength and power',
        category: 'Strength',
        duration: 45,
        exercises: [
          {
            id: 'ex-3',
            name: 'Squats',
            sets: [
              { reps: 12, weight: 185, restTime: 120 },
              { reps: 10, weight: 205, restTime: 120 },
              { reps: 8, weight: 225, restTime: 120 }
            ],
            order: 1,
            notes: 'Progressive overload'
          },
          {
            id: 'ex-4',
            name: 'Deadlift',
            sets: [
              { reps: 5, weight: 275, restTime: 180 },
              { reps: 5, weight: 275, restTime: 180 },
              { reps: 5, weight: 275, restTime: 180 }
            ],
            order: 2,
            notes: 'Focus on form over weight'
          }
        ],
        created_by: 'system',
        is_public: true
      },
      {
        name: 'HIIT Cardio Blast',
        description: 'High-intensity interval training for cardiovascular fitness',
        category: 'Cardio',
        duration: 30,
        exercises: [
          {
            id: 'ex-5',
            name: 'Push-ups',
            sets: [
              { reps: 15, restTime: 30 },
              { reps: 15, restTime: 30 },
              { reps: 15, restTime: 30 },
              { reps: 15, restTime: 30 }
            ],
            order: 1,
            notes: 'High intensity, short rest'
          },
          {
            id: 'ex-6',
            name: 'Squats',
            sets: [
              { reps: 20, restTime: 30 },
              { reps: 20, restTime: 30 },
              { reps: 20, restTime: 30 },
              { reps: 20, restTime: 30 }
            ],
            order: 2,
            notes: 'Explosive movement'
          }
        ],
        created_by: 'system',
        is_public: true
      },
      {
        name: 'Full Body Functional',
        description: 'Functional movements for everyday strength',
        category: 'Functional',
        duration: 50,
        exercises: [
          {
            id: 'ex-7',
            name: 'Push-ups',
            sets: [
              { reps: 12, restTime: 60 },
              { reps: 12, restTime: 60 },
              { reps: 12, restTime: 60 }
            ],
            order: 1,
            notes: 'Maintain proper form'
          },
          {
            id: 'ex-8',
            name: 'Squats',
            sets: [
              { reps: 15, restTime: 60 },
              { reps: 15, restTime: 60 },
              { reps: 15, restTime: 60 }
            ],
            order: 2,
            notes: 'Full range of motion'
          },
          {
            id: 'ex-9',
            name: 'Pull-ups',
            sets: [
              { reps: 6, restTime: 90 },
              { reps: 6, restTime: 90 },
              { reps: 6, restTime: 90 }
            ],
            order: 3,
            notes: 'Assisted if necessary'
          }
        ],
        created_by: 'system',
        is_public: true
      }
    ];

    // Insert templates one by one
    for (const template of defaultTemplates) {
      await createWorkoutTemplate(template);
    }

    console.log('Default workout templates created successfully');
  } catch (error) {
    console.error('Error initializing default templates:', error);
  }
};

export async function fetchWorkoutTemplatesFromDB(): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*');
  if (error) {
    console.error('Error fetching workout templates from DB:', error);
    return [];
  }
  return data as WorkoutTemplate[];
}