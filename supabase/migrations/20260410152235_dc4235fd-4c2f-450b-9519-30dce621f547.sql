
-- Table for body measurements tracking
CREATE TABLE public.body_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC,
  body_fat_percent NUMERIC,
  muscle_mass_kg NUMERIC,
  chest_cm NUMERIC,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  arm_cm NUMERIC,
  thigh_cm NUMERIC,
  calf_cm NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measurements" ON public.body_measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own measurements" ON public.body_measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own measurements" ON public.body_measurements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own measurements" ON public.body_measurements FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON public.body_measurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for initial evaluation / anamnesis
CREATE TABLE public.initial_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  objectives TEXT,
  medical_restrictions TEXT,
  injuries TEXT,
  food_allergies TEXT,
  medications TEXT,
  experience_level TEXT DEFAULT 'beginner',
  sleep_hours NUMERIC,
  stress_level TEXT DEFAULT 'medium',
  daily_water_liters NUMERIC,
  sports_history TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.initial_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluation" ON public.initial_evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evaluation" ON public.initial_evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evaluation" ON public.initial_evaluations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evaluation" ON public.initial_evaluations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_initial_evaluations_updated_at
  BEFORE UPDATE ON public.initial_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
