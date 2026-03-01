CREATE TABLE public.saved_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Mi rutina',
  routine_content text NOT NULL,
  frequency_days integer,
  level text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routines" ON public.saved_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own routines" ON public.saved_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own routines" ON public.saved_routines FOR DELETE USING (auth.uid() = user_id);