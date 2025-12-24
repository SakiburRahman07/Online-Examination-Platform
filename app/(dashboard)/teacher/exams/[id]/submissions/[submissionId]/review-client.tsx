"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LatexRenderer } from "@/components/latex-renderer";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Save,
  Loader2,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface Answer {
  id: string;
  question_id: string;
  answer_text: string | null;
  answer_image_url: string | null;
  marks_obtained: number;
  is_correct: boolean | null;
  question: {
    id: string;
    question_order: number;
    type: string;
    question_text: string;
    marks: number;
    options: string[] | null;
    correct_answer: string | null;
    solution: string | null;
  };
}

interface Submission {
  id: string;
  exam_id: string;
  student_id: string;
  total_marks: number;
  is_submitted: boolean;
  submitted_at: string;
  student: { full_name: string; email: string };
  answers: Answer[];
}

interface Exam {
  id: string;
  title: string;
}

export default function SubmissionReviewClient({
  submission: initialSubmission,
  exam,
}: {
  submission: Submission;
  exam: Exam;
}) {
  const router = useRouter();
  const [submission, setSubmission] = useState(initialSubmission);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize grades
  useEffect(() => {
    const initialGrades: Record<string, number> = {};
    submission.answers.forEach((answer) => {
      if (answer.question.type === "written") {
        initialGrades[answer.id] = answer.marks_obtained;
      }
    });
    setGrades(initialGrades);
  }, [submission]);

  const handleGradeChange = (answerId: string, marks: number, maxMarks: number) => {
    const validMarks = Math.min(Math.max(0, marks), maxMarks);
    setGrades((prev) => ({ ...prev, [answerId]: validMarks }));
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const supabase = createClient();

      // Update each graded answer
      for (const [answerId, marks] of Object.entries(grades)) {
        await supabase
          .from("answers")
          .update({ marks_obtained: marks })
          .eq("id", answerId);
      }

      // Recalculate total marks
      const newTotal = submission.answers.reduce((sum, answer) => {
        if (answer.question.type === "written") {
          return sum + (grades[answer.id] || 0);
        }
        return sum + answer.marks_obtained;
      }, 0);

      // Update submission total
      await supabase
        .from("submissions")
        .update({ total_marks: newTotal })
        .eq("id", submission.id);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (error) {
      console.error("Error saving grades:", error);
    } finally {
      setSaving(false);
    }
  };

  const sortedAnswers = [...submission.answers].sort(
    (a, b) => a.question.question_order - b.question.question_order
  );

  const maxMarks = submission.answers.reduce(
    (sum, a) => sum + a.question.marks,
    0
  );

  const currentTotal = submission.answers.reduce((sum, answer) => {
    if (answer.question.type === "written") {
      return sum + (grades[answer.id] || 0);
    }
    return sum + answer.marks_obtained;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Link
            href={`/teacher/exams/${exam.id}/submissions`}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Submissions
          </Link>
          <h1 className="text-3xl font-bold gradient-text">{exam.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Reviewing: {submission.student.full_name} ({submission.student.email})
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {currentTotal}
            <span className="text-lg text-slate-500 dark:text-slate-400">/{maxMarks}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Score</p>
        </div>
      </div>

      {/* Questions Review */}
      <div className="space-y-6">
        {sortedAnswers.map((answer, index) => (
          <Card key={answer.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </span>
                  Question {index + 1}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={answer.question.type === "mcq" ? "default" : "outline"}>
                    {answer.question.type.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">{answer.question.marks} marks</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question */}
              <LatexRenderer
                content={answer.question.question_text}
                className="text-slate-700 dark:text-slate-200"
              />

              {/* MCQ Answer */}
              {answer.question.type === "mcq" && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {answer.question.options?.map((option, i) => {
                      const isCorrect = option === answer.question.correct_answer;
                      const isSelected = option === answer.answer_text;
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrect
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : isSelected && !isCorrect
                              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {option}
                          {isCorrect && (
                            <CheckCircle className="inline-block h-4 w-4 text-green-600 ml-2" />
                          )}
                          {isSelected && !isCorrect && (
                            <XCircle className="inline-block h-4 w-4 text-red-600 ml-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {answer.is_correct ? (
                      <Badge variant="success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Correct - {answer.marks_obtained} marks
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Incorrect - 0 marks
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Written Answer */}
              {answer.question.type === "written" && (
                <div className="space-y-4">
                  {/* Student's Answer Image */}
                  {answer.answer_image_url ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Student&apos;s Answer:
                      </p>
                      <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                        <img
                          src={answer.answer_image_url}
                          alt="Student's written answer"
                          className="max-w-full max-h-[500px] mx-auto object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-center">
                      No answer submitted
                    </div>
                  )}

                  {/* Solution */}
                  {answer.question.solution && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        Reference Solution
                      </p>
                      <LatexRenderer content={answer.question.solution} />
                    </div>
                  )}

                  {/* Grading Input */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <label className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      Assign Marks:
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={answer.question.marks}
                        value={grades[answer.id] ?? 0}
                        onChange={(e) =>
                          handleGradeChange(
                            answer.id,
                            parseInt(e.target.value) || 0,
                            answer.question.marks
                          )
                        }
                        className="w-20 text-center"
                      />
                      <span className="text-slate-600 dark:text-slate-400">
                        / {answer.question.marks}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4 flex justify-center">
        <Button
          onClick={handleSaveGrades}
          disabled={saving}
          size="lg"
          className="gap-2 shadow-lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="h-5 w-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Grades
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
