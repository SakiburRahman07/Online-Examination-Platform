-- ExamHub Database Schema
-- Run this SQL in your Supabase Dashboard SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_order INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'written')),
  question_text TEXT NOT NULL,
  image_url TEXT,
  options JSONB,
  correct_answer TEXT,
  marks INTEGER NOT NULL DEFAULT 1,
  solution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  total_marks INTEGER DEFAULT 0,
  is_submitted BOOLEAN DEFAULT FALSE,
  UNIQUE(exam_id, student_id)
);

-- Answers table
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT,
  answer_image_url TEXT,
  marks_obtained INTEGER DEFAULT 0,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

-- ====================
-- ROW LEVEL SECURITY
-- ====================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Exams policies
CREATE POLICY "Teachers can manage own exams" 
  ON public.exams FOR ALL 
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view published exams" 
  ON public.exams FOR SELECT 
  USING (is_published = TRUE);

-- Questions policies
CREATE POLICY "Teachers can manage questions for own exams" 
  ON public.questions FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.exams 
      WHERE exams.id = questions.exam_id 
      AND exams.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view questions of published exams" 
  ON public.questions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.exams 
      WHERE exams.id = questions.exam_id 
      AND exams.is_published = TRUE
    )
  );

-- Submissions policies
CREATE POLICY "Students can manage own submissions" 
  ON public.submissions FOR ALL 
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view submissions for their exams" 
  ON public.submissions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.exams 
      WHERE exams.id = submissions.exam_id 
      AND exams.teacher_id = auth.uid()
    )
  );

-- Answers policies
CREATE POLICY "Students can manage own answers" 
  ON public.answers FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions 
      WHERE submissions.id = answers.submission_id 
      AND submissions.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their exams" 
  ON public.answers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.exams e ON s.exam_id = e.id
      WHERE s.id = answers.submission_id 
      AND e.teacher_id = auth.uid()
    )
  );

-- ====================
-- STORAGE BUCKETS
-- ====================
-- Note: Create these buckets in Supabase Dashboard > Storage

-- 1. Create bucket: question-images (public)
-- 2. Create bucket: answer-images (public)

-- Storage policies for question-images
-- Allow teachers to upload question images
-- Allow anyone to view question images

-- Storage policies for answer-images
-- Allow students to upload answer images
-- Allow students and teachers to view answer images
