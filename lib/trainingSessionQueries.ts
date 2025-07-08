import { supabase } from './supabase';
import { TrainingSession, WorkoutTemplate } from '@/types/workout';

// Get training session by ID
export const getTrainingSession = async (sessionId: string): Promise<TrainingSession | null> => {
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(id, full_name, email),
        trainer:profiles!training_sessions_trainer_id_fkey(id, full_name, email)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching training session:', error);
      return null;
    }

    return data;
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
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(id, full_name, email),
        trainer:profiles!training_sessions_trainer_id_fkey(id, full_name, email)
      `)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching client training sessions:', error);
      return [];
    }

    return data || [];
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
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(id, full_name, email),
        trainer:profiles!training_sessions_trainer_id_fkey(id, full_name, email)
      `)
      .eq('trainer_id', trainerId)
      .order('scheduled_date', { ascending: true });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trainer training sessions:', error);
      return [];
    }

    return data || [];
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
    const { data, error } = await supabase
      .from('training_sessions')
      .insert({
        ...sessionData,
        session_data: sessionData.session_data || {},
        completion_data: sessionData.completion_data || {},
      })
      .select(`
        *,
        client:profiles!training_sessions_client_id_fkey(id, full_name, email),
        trainer:profiles!training_sessions_trainer_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating training session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createTrainingSession:', error);
    return null;
  }
};