
CREATE TABLE public.saved_diets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  diet_plan JSONB NOT NULL,
  meals_per_day INTEGER NOT NULL DEFAULT 3,
  target_calories INTEGER NOT NULL,
  target_protein INTEGER NOT NULL,
  target_carbs INTEGER NOT NULL,
  target_fat INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_diets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diets" ON public.saved_diets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diets" ON public.saved_diets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own diets" ON public.saved_diets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own diets" ON public.saved_diets FOR UPDATE USING (auth.uid() = user_id);
