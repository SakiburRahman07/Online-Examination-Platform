export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'teacher' | 'student'
export type QuestionType = 'mcq' | 'written'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Exam {
  id: string
  teacher_id: string
  title: string
  description: string | null
  duration: number
  is_published: boolean
  created_at: string
  starts_at: string | null
  ends_at: string | null
  teacher?: Profile
}

export interface Question {
  id: string
  exam_id: string
  question_order: number
  type: QuestionType
  question_text: string
  image_url: string | null
  options: string[] | null
  correct_answer: string | null
  marks: number
  solution: string | null
  created_at: string
}

export interface Submission {
  id: string
  exam_id: string
  student_id: string
  started_at: string
  submitted_at: string | null
  total_marks: number
  is_submitted: boolean
  exam?: Exam
  student?: Profile
  answers?: Answer[]
}

export interface Answer {
  id: string
  submission_id: string
  question_id: string
  answer_text: string | null
  answer_image_url: string | null
  marks_obtained: number
  is_correct: boolean | null
  created_at: string
  question?: Question
}

// JSON Import Types
export interface QuizImportQuestion {
  id?: number
  type: QuestionType
  question: string
  image?: string
  options?: string[]
  correctAnswer?: string
  marks: number
  solution?: string
}

export interface QuizImport {
  title: string
  description?: string
  duration: number
  questions: QuizImportQuestion[]
}
