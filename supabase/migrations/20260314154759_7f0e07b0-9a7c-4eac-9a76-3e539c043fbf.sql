
-- Create storage bucket for exercise illustrations
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-illustrations', 'exercise-illustrations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read exercise illustrations
CREATE POLICY "Public read access for exercise illustrations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exercise-illustrations');

-- Allow authenticated users to upload exercise illustrations
CREATE POLICY "Authenticated users can upload exercise illustrations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exercise-illustrations');
