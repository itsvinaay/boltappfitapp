import { supabase } from './supabase';

export interface TodayClientData {
  profile: any;
  todayStats: any;
  workoutSessions: any[];
  activeGoals: any[];
  clientAssignment: any;
}

export interface TodayTrainerData {
  profile: any;
  trainingSessions: any[];
  clients: any[];
}

export interface TodayNutritionistData {
  profile: any;
  consultations: any[];
  clients: any[];
}

export interface TodayAdminData {
  profile: any;
  systemStats: any;
}

// Get current user profile
export const getCurrentUserProfile = async () => {
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

// Client-specific queries
export const getClientTodayData = async (): Promise<TodayClientData | null> => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== 'client') return null;

    const today = new Date().toISOString().split('T')[0];

    // Get today's stats
    const { data: todayStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .single();

    // Get today's workout sessions
    const { data: workoutSessions } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('client_id', profile.id)
      .eq('date', today)
      .order('start_time', { ascending: true });

    // Get active goals
    const { data: activeGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Get client assignment (trainer/nutritionist)
    const { data: clientAssignment } = await supabase
      .from('client_assignments')
      .select(`
        *,
        trainer:profiles!client_assignments_trainer_id_fkey(id, full_name, email),
        nutritionist:profiles!client_assignments_nutritionist_id_fkey(id, full_name, email)
      `)
      .eq('client_id', profile.id)
      .eq('status', 'active')
      .single();

    return {
      profile,
      todayStats: todayStats || null,
      workoutSessions: workoutSessions || [],
      activeGoals: activeGoals || [],
      clientAssignment: clientAssignment || null,
    };
  } catch (error) {
    console.error('Error fetching client today data:', error);
    return null;
  }
};

// Trainer-specific queries
export const getTrainerTodayData = async (): Promise<TodayTrainerData | null> => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== 'trainer') return null;

    const today = new Date().toISOString().split('T')[0];

    // Get today's training sessions
    const { data: trainingSessions } = await supabase
      .from('training_sessions')
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(id, full_name, email)
      `)
      .eq('trainer_id', profile.id)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });

    // Get trainer's clients
    const { data: clientAssignments } = await supabase
      .from('client_assignments')
      .select(`
        client:profiles!client_assignments_client_id_fkey(*)
      `)
      .eq('trainer_id', profile.id)
      .eq('status', 'active');

    const clients = clientAssignments?.map(assignment => assignment.client).filter(Boolean) || [];

    return {
      profile,
      trainingSessions: trainingSessions || [],
      clients,
    };
  } catch (error) {
    console.error('Error fetching trainer today data:', error);
    return null;
  }
};

// Nutritionist-specific queries
export const getNutritionistTodayData = async (): Promise<TodayNutritionistData | null> => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== 'nutritionist') return null;

    const today = new Date().toISOString().split('T')[0];

    // Get today's consultations
    const { data: consultations } = await supabase
      .from('consultations')
      .select(`
        *,
        client:profiles!consultations_client_id_fkey(id, full_name, email)
      `)
      .eq('nutritionist_id', profile.id)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });

    // Get nutritionist's clients
    const { data: clientAssignments } = await supabase
      .from('client_assignments')
      .select(`
        client:profiles!client_assignments_client_id_fkey(*)
      `)
      .eq('nutritionist_id', profile.id)
      .eq('status', 'active');

    const clients = clientAssignments?.map(assignment => assignment.client).filter(Boolean) || [];

    return {
      profile,
      consultations: consultations || [],
      clients,
    };
  } catch (error) {
    console.error('Error fetching nutritionist today data:', error);
    return null;
  }
};

// Admin-specific queries
export const getAdminTodayData = async (): Promise<TodayAdminData | null> => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'hr')) return null;

    // Get system statistics
    const [usersResult, sessionsResult, assignmentsResult] = await Promise.all([
      supabase.from('profiles').select('role', { count: 'exact' }),
      supabase.from('workout_sessions').select('completed', { count: 'exact' }).eq('date', new Date().toISOString().split('T')[0]),
      supabase.from('client_assignments').select('status', { count: 'exact' }).eq('status', 'active')
    ]);

    const systemStats = {
      totalUsers: usersResult.count || 0,
      todaySessions: sessionsResult.count || 0,
      activeAssignments: assignmentsResult.count || 0,
      systemHealth: 98.5, // Mock data
    };

    return {
      profile,
      systemStats,
    };
  } catch (error) {
    console.error('Error fetching admin today data:', error);
    return null;
  }
};

// Update daily stats
export const updateDailyStats = async (stats: {
  steps?: number;
  water_intake_ml?: number;
  calories_consumed?: number;
  calories_burned?: number;
  weight_kg?: number;
  sleep_hours?: number;
  mood_rating?: number;
}) => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_stats')
      .upsert({
        user_id: profile.id,
        date: today,
        ...stats,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating daily stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateDailyStats:', error);
    return null;
  }
};

// Create or update workout session
export const createWorkoutSession = async (sessionData: {
  template_id?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  exercises?: any[];
  notes?: string;
  completed?: boolean;
}) => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        client_id: profile.id,
        date: today,
        ...sessionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createWorkoutSession:', error);
    return null;
  }
};

// Create or update goal
export const createGoal = async (goalData: {
  title: string;
  description?: string;
  emoji?: string;
  target_date?: string;
  progress_percentage?: number;
  category?: string;
}) => {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: profile.id,
        ...goalData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createGoal:', error);
    return null;
  }
};