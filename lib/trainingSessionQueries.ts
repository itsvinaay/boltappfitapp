import { supabase } from './supabase';
import { TrainingSession, WorkoutTemplate } from '@/types/workout';

// Get training session by ID
export const getTrainingSession = async (sessionId: string): Promise<TrainingSession | null> => {
  try {
    // First get the training session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching training session:', sessionError);
      return null;
    }

    if (!session) {
      console.log('No training session found with ID:', sessionId);
      return null;
    }

    // Then get the client and trainer data separately
    const [clientResult, trainerResult] = await Promise.all([
      session.client_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.client_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null }),
      session.trainer_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.trainer_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null })
    ]);

    // Log any profile fetch errors but don't fail the whole operation
    if (clientResult.error) {
      console.warn('Error fetching client profile:', clientResult.error);
    }
    if (trainerResult.error) {
      console.warn('Error fetching trainer profile:', trainerResult.error);
    }

    return {
      ...session,
      client: clientResult.data,
      trainer: trainerResult.data
    };
  } catch (error) {
    console.error('Error in getTrainingSession:', error);
    return null;
  }
};

// Update training session with workout data
export const updateTrainingSessionData = async (
  sessionId: string,
  sessionData: any,
  completionData?: any
): Promise<boolean> => {
  try {
    const updateData: any = {
      session_data: sessionData,
      updated_at: new Date().toISOString(),
    };

    if (completionData) {
      updateData.completion_data = completionData;
      updateData.status = 'completed';
    }

    const { error } = await supabase
      .from('training_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTrainingSessionData:', error);
    return false;
  }
};

// Complete training session
export const completeTrainingSession = async (
  sessionId: string,
  completionData: {
    exercises_completed?: any[];
    trainer_notes?: string;
    session_rating?: number;
    duration_minutes?: number;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        status: 'completed',
        completion_data: completionData,
        exercises_completed: completionData.exercises_completed,
        trainer_notes: completionData.trainer_notes,
        session_rating: completionData.session_rating,
        duration_minutes: completionData.duration_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing training session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeTrainingSession:', error);
    return false;
  }
};

// Get training sessions for a client
export const getClientTrainingSessions = async (
  clientId: string,
  startDate?: string,
  endDate?: string
): Promise<TrainingSession[]> => {
  try {
    let query = supabase
      .from('training_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching client training sessions:', error);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get unique client and trainer IDs
    const clientIds = [...new Set(sessions.map(s => s.client_id))];
    const trainerIds = [...new Set(sessions.map(s => s.trainer_id))];

    // Fetch all profiles in batches
    const [clientProfiles, trainerProfiles] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', clientIds),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', trainerIds)
    ]);

    // Create lookup maps
    const clientMap = new Map(Array.isArray(clientProfiles?.data) ? clientProfiles.data.map(p => [p.id, p]) : []);
    const trainerMap = new Map(Array.isArray(trainerProfiles?.data) ? trainerProfiles.data.map(p => [p.id, p]) : []);

    // Combine the data
    return sessions.map(session => ({
      ...session,
      client: clientMap?.get ? clientMap.get(session.client_id) : undefined,
      trainer: trainerMap?.get ? trainerMap.get(session.trainer_id) : undefined
    }));
  } catch (error) {
    console.error('Error in getClientTrainingSessions:', error);
    return [];
  }
};

// Get training sessions for a trainer
export const getTrainerTrainingSessions = async (
  trainerId: string,
  startDate?: string,
  endDate?: string
): Promise<TrainingSession[]> => {
  try {
    let query = supabase
      .from('training_sessions')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: true });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching trainer training sessions:', error);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get unique client and trainer IDs
    const clientIds = [...new Set(sessions.map(s => s.client_id))];
    const trainerIds = [...new Set(sessions.map(s => s.trainer_id))];

    // Fetch all profiles in batches
    const [clientProfiles, trainerProfiles] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', clientIds),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', trainerIds)
    ]);

    // Create lookup maps
    const clientMap = new Map(Array.isArray(clientProfiles?.data) ? clientProfiles.data.map(p => [p.id, p]) : []);
    const trainerMap = new Map(Array.isArray(trainerProfiles?.data) ? trainerProfiles.data.map(p => [p.id, p]) : []);

    // Combine the data
    return sessions.map(session => ({
      ...session,
      client: clientMap?.get ? clientMap.get(session.client_id) : undefined,
      trainer: trainerMap?.get ? trainerMap.get(session.trainer_id) : undefined
    }));
  } catch (error) {
    console.error('Error in getTrainerTrainingSessions:', error);
    return [];
  }
};

// Create a new training session
export const createTrainingSession = async (
  sessionData: Omit<TrainingSession, 'id' | 'created_at' | 'updated_at'>
): Promise<TrainingSession | null> => {
  try {
    const { data: session, error } = await supabase
      .from('training_sessions')
      .insert({
        ...sessionData,
        session_data: sessionData.session_data || {},
        completion_data: sessionData.completion_data || {},
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error creating training session:', error);
      return null;
    }

    if (!session) {
      console.error('No session data returned after creation');
      return null;
    }

    // Get the client and trainer data separately
    const [clientResult, trainerResult] = await Promise.all([
      session.client_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.client_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null }),
      session.trainer_id ? supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', session.trainer_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null })
    ]);

    // Log any profile fetch errors but don't fail the whole operation
    if (clientResult.error) {
      console.warn('Error fetching client profile:', clientResult.error);
    }
    if (trainerResult.error) {
      console.warn('Error fetching trainer profile:', trainerResult.error);
    }

    return {
      ...session,
      client: clientResult.data,
      trainer: trainerResult.data
    };
  } catch (error) {
    console.error('Error in createTrainingSession:', error);
    return null;
  }
};

// Fetch all training sessions for a client and plan
export const getTrainingSessionsForPlanSessions = async (
  clientId: string,
  planId: string
): Promise<TrainingSession[]> => {
  try {
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching training sessions for plan sessions:', error);
      return [];
    }
    return sessions || [];
  } catch (error) {
    console.error('Error in getTrainingSessionsForPlanSessions:', error);
    return [];
  }zz
};