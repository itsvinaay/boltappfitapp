import { supabase } from './supabase';

export interface MealType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sort_order: number;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  meal_type_id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  meal_type?: MealType;
  photos?: FoodPhoto[];
}

export interface FoodPhoto {
  id: string;
  food_entry_id: string;
  photo_url: string;
  photo_path?: string;
  caption?: string;
  is_primary: boolean;
  created_at: string;
}

export interface NutritionGoals {
  id: string;
  user_id: string;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  daily_fiber_g: number;
  daily_sugar_g: number;
  daily_sodium_mg: number;
  created_at: string;
  updated_at: string;
}

export interface DayNutritionSummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  entries: FoodEntry[];
}

// Get all meal types
export const getMealTypes = async (): Promise<MealType[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching meal types:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMealTypes:', error);
    return [];
  }
};

// Get user's nutrition goals
export const getNutritionGoals = async (): Promise<NutritionGoals | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return null;

    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching nutrition goals:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getNutritionGoals:', error);
    return null;
  }
};

// Create or update nutrition goals
export const upsertNutritionGoals = async (goals: Partial<NutritionGoals>): Promise<NutritionGoals | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return null;

    const { data, error } = await supabase
      .from('nutrition_goals')
      .upsert({
        user_id: profile.id,
        ...goals,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting nutrition goals:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertNutritionGoals:', error);
    return null;
  }
};

// Get food entries for a specific date
export const getFoodEntriesForDate = async (date: string): Promise<FoodEntry[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get user profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return [];

    const { data, error } = await supabase
      .from('food_entries')
      .select(`
        *,
        meal_type:meal_types(*),
        photos:food_photos(*)
      `)
      .eq('user_id', profile.id)
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching food entries:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFoodEntriesForDate:', error);
    return [];
  }
};

// Get food entries for multiple dates (for timeline view)
export const getFoodEntriesForDateRange = async (startDate: string, endDate: string): Promise<DayNutritionSummary[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get user profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return [];

    const { data, error } = await supabase
      .from('food_entries')
      .select(`
        *,
        meal_type:meal_types(*),
        photos:food_photos(*)
      `)
      .eq('user_id', profile.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching food entries for range:', error);
      return [];
    }

    // Group by date and calculate daily totals
    const groupedByDate = (data || []).reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          total_fiber: 0,
          total_sugar: 0,
          total_sodium: 0,
          entries: [],
        };
      }

      acc[date].total_calories += entry.calories || 0;
      acc[date].total_protein += entry.protein_g || 0;
      acc[date].total_carbs += entry.carbs_g || 0;
      acc[date].total_fat += entry.fat_g || 0;
      acc[date].total_fiber += entry.fiber_g || 0;
      acc[date].total_sugar += entry.sugar_g || 0;
      acc[date].total_sodium += entry.sodium_mg || 0;
      acc[date].entries.push(entry);

      return acc;
    }, {} as Record<string, DayNutritionSummary>);

    return Object.values(groupedByDate);
  } catch (error) {
    console.error('Error in getFoodEntriesForDateRange:', error);
    return [];
  }
};

// Create a new food entry
export const createFoodEntry = async (entryData: Partial<FoodEntry>): Promise<FoodEntry | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return null;

    const { data, error } = await supabase
      .from('food_entries')
      .insert({
        user_id: profile.id,
        ...entryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        meal_type:meal_types(*),
        photos:food_photos(*)
      `)
      .single();

    if (error) {
      console.error('Error creating food entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createFoodEntry:', error);
    return null;
  }
};

// Update a food entry
export const updateFoodEntry = async (id: string, entryData: Partial<FoodEntry>): Promise<FoodEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('food_entries')
      .update({
        ...entryData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        meal_type:meal_types(*),
        photos:food_photos(*)
      `)
      .single();

    if (error) {
      console.error('Error updating food entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateFoodEntry:', error);
    return null;
  }
};

// Delete a food entry
export const deleteFoodEntry = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting food entry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFoodEntry:', error);
    return false;
  }
};

// Add photo to food entry
export const addFoodPhoto = async (foodEntryId: string, photoData: Partial<FoodPhoto>): Promise<FoodPhoto | null> => {
  try {
    const { data, error } = await supabase
      .from('food_photos')
      .insert({
        food_entry_id: foodEntryId,
        ...photoData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding food photo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addFoodPhoto:', error);
    return null;
  }
};

// Delete food photo
export const deleteFoodPhoto = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('food_photos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting food photo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFoodPhoto:', error);
    return false;
  }
};