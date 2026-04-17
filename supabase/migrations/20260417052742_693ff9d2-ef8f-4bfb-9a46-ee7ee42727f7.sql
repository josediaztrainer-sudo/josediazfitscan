
-- Create private bucket for physique photos used in routine generation
INSERT INTO storage.buckets (id, name, public)
VALUES ('physique-photos', 'physique-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: each user can manage their own folder (user_id as first path segment)
CREATE POLICY "Users can view own physique photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own physique photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own physique photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own physique photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
