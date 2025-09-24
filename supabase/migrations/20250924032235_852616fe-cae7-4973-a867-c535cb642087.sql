-- Create storage bucket for content media
INSERT INTO storage.buckets (id, name, public) VALUES ('content-media', 'content-media', true);

-- Create policy for content media bucket
CREATE POLICY "Anyone can view content media" ON storage.objects FOR SELECT USING (bucket_id = 'content-media');

CREATE POLICY "Authenticated users can upload content media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'content-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploaded content media" ON storage.objects FOR UPDATE USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploaded content media" ON storage.objects FOR DELETE USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);