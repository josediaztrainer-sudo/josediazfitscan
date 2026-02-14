export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  id: string;
  user_id: string;
  age: number | null;
  sex: 'male' | 'female' | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  goal: string | null;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  onboarding_completed: boolean;
  trial_ends_at: string | null;
  is_premium: boolean;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

export interface MealScan {
  id: string;
  user_id: string;
  daily_log_id: string | null;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
  photo_url: string | null;
  foods_json: any;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  age: number,
  activity: ActivityLevel,
): number {
  // Mifflin-St Jeor
  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

export function calculateMacros(tdee: number, weightKg: number) {
  // 20-25% deficit for fat loss
  const targetCalories = Math.round(tdee * 0.775); // 22.5% deficit
  // Protein: 2.4 g/kg (middle of 2.2-2.6)
  const proteinG = Math.round(weightKg * 2.4);
  const proteinCal = proteinG * 4;
  // Fat: 25% of target calories
  const fatCal = Math.round(targetCalories * 0.25);
  const fatG = Math.round(fatCal / 9);
  // Carbs: remainder
  const carbsCal = targetCalories - proteinCal - fatCal;
  const carbsG = Math.round(carbsCal / 4);

  return { targetCalories, proteinG, carbsG, fatG };
}
