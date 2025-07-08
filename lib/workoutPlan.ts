import { supabase } from './supabase';

export interface WorkoutPlan {
  id: string;
  client_id: string;
  trainer_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  schedule_type: 'weekly' | 'monthly' | 'custom';
  schedule_data: any; // Flexible schedule configuration
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PlanSession {
  id: string;
  plan_id: string;
  template_id?: string;
  scheduled_date: string;
  scheduled_time?: string;
  day_of_week?: string;
  week_number?: number;
  status: 'scheduled' | 'completed' | 'skipped' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Get current user profile
const getCurrentUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
};

// Save a workout plan
export const saveWorkoutPlan = async (plan: Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .insert(plan)
      .select()
      .single();

    if (error) {
      console.error('Error saving workout plan:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in saveWorkoutPlan:', error);
    return null;
  }
};

// Update a workout plan
export const updateWorkoutPlan = async (id: string, updates: Partial<WorkoutPlan>): Promise<WorkoutPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout plan:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateWorkoutPlan:', error);
    return null;
  }
};

// Get a workout plan by ID
export const getWorkoutPlan = async (id: string): Promise<WorkoutPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching workout plan:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getWorkoutPlan:', error);
    return null;
  }
};

// Get all workout plans for a trainer
export const getTrainerWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trainer workout plans:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTrainerWorkoutPlans:', error);
    return [];
  }
};

// Get all workout plans for a client
export const getClientWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client workout plans:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getClientWorkoutPlans:', error);
    return [];
  }
};

// Delete a workout plan
export const deleteWorkoutPlan = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout plan:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorkoutPlan:', error);
    return false;
  }
};

// Save a plan session
export const savePlanSession = async (session: Omit<PlanSession, 'id' | 'created_at' | 'updated_at'>): Promise<PlanSession | null> => {
  try {
    const { data, error } = await supabase
      .from('plan_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Error saving plan session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in savePlanSession:', error);
    return null;
  }
};

// Get plan sessions for a plan
export const getPlanSessions = async (planId: string): Promise<PlanSession[]> => {
  try {
    const { data, error } = await supabase
      .from('plan_sessions')
      .select('*')
      .eq('plan_id', planId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching plan sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPlanSessions:', error);
    return [];
  }
};

// Update a plan session
export const updatePlanSession = async (id: string, updates: Partial<PlanSession>): Promise<PlanSession | null> => {
  try {
    const { data, error } = await supabase
      .from('plan_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updatePlanSession:', error);
    return null;
  }
};

// Generate plan sessions based on schedule
export const generatePlanSessions = async (plan: WorkoutPlan): Promise<boolean> => {
  try {
    const sessions: Omit<PlanSession, 'id' | 'created_at' | 'updated_at'>[] = [];
    const startDate = new Date(plan.start_date);
    const endDate = new Date(plan.end_date);

    if (plan.schedule_type === 'weekly') {
      // Generate weekly recurring sessions
      const weeklySchedule = plan.schedule_data;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (weeklySchedule[dayOfWeek]) {
          sessions.push({
            plan_id: plan.id,
            template_id: weeklySchedule[dayOfWeek],
            scheduled_date: currentDate.toISOString().split('T')[0],
            day_of_week: dayOfWeek,
            status: 'scheduled',
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (plan.schedule_type === 'monthly') {
      // Generate monthly sessions
      const monthlySchedule = plan.schedule_data;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const weekOfMonth = Math.ceil(currentDate.getDate() / 7);
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (monthlySchedule[weekOfMonth] && monthlySchedule[weekOfMonth][dayOfWeek]) {
          sessions.push({
            plan_id: plan.id,
            template_id: monthlySchedule[weekOfMonth][dayOfWeek],
            scheduled_date: currentDate.toISOString().split('T')[0],
            day_of_week: dayOfWeek,
            week_number: weekOfMonth,
            status: 'scheduled',
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (plan.schedule_type === 'custom') {
      // Generate custom sessions
      const customSchedule = plan.schedule_data;
      
      if (Array.isArray(customSchedule)) {
        customSchedule.forEach((customDay: any) => {
          if (customDay.date && customDay.templateId) {
            sessions.push({
              plan_id: plan.id,
              template_id: customDay.templateId,
              scheduled_date: customDay.date,
              status: 'scheduled',
              notes: customDay.label,
            });
          }
        });
      }
    }

    // Insert all sessions
    if (sessions.length > 0) {
      const { error } = await supabase
        .from('plan_sessions')
        .insert(sessions);

      if (error) {
        console.error('Error generating plan sessions:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in generatePlanSessions:', error);
    return false;
  }
};