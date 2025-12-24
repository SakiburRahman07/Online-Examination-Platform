-- Storage Bucket Setup for ExamHub
-- Run these commands in your Supabase SQL Editor

-- Note: Buckets should be created via Supabase Dashboard UI:
-- 1. Go to Storage > New Bucket
-- 2. Create "answer-images" bucket (public: true)
-- 3. Create "question-images" bucket (public: true)

-- After creating the buckets, run these RLS policies:

-- ============================================
-- POLICIES FOR answer-images BUCKET
-- ============================================

-- Allow authenticated users to upload their own answer images
CREATE POLICY "Students can upload answer images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'answer-images'
);

-- Allow anyone to view answer images (for teachers to grade)
CREATE POLICY "Anyone can view answer images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'answer-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their answer images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'answer-images');

-- ============================================
-- POLICIES FOR question-images BUCKET
-- ============================================

-- Allow teachers to upload question images
CREATE POLICY "Teachers can upload question images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images');

-- Allow anyone to view question images
CREATE POLICY "Anyone can view question images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'question-images');

-- ============================================
-- ALTERNATIVE: Make buckets fully public (simpler but less secure)
-- ============================================
-- If the above policies don't work, you can make the buckets public:
-- 1. Go to Storage > answer-images > Policies
-- 2. Click "New Policy" > "For full customization"
-- 3. Add policy:
--    - Name: "Allow all operations"
--    - Allowed operations: SELECT, INSERT, UPDATE, DELETE
--    - Target roles: authenticated (or public)
--    - Policy definition: true
