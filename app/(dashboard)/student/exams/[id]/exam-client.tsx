"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer } from "@/components/timer";
import { LatexRenderer } from "@/components/latex-renderer";
import { CaptureButton } from "@/components/camera-capture";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Exam, Question, Submission } from "@/lib/types";

interface ExamTakingClientProps {
  exam: Exam;
  questions: Question[];
  submission: Submission;
}

export default function ExamTakingClient({
  exam,
  questions,
  submission: initialSubmission,
}: ExamTakingClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { text?: string; image?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [startTime] = useState(new Date(initialSubmission.started_at));

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k]?.text || answers[k]?.image
  ).length;

  // Load saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`exam-${exam.id}-answers`);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, [exam.id]);

  // Save answers to localStorage
  useEffect(() => {
    localStorage.setItem(`exam-${exam.id}-answers`, JSON.stringify(answers));
  }, [answers, exam.id]);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text: answer },
    }));
  };

  const handleImageCapture = (questionId: string, imageData: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], image: imageData },
    }));
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);

    try {
      const supabase = createClient();

      // Calculate MCQ scores
      let totalMarks = 0;
      const answerRecords = [];

      for (const question of questions) {
        const answer = answers[question.id];
        let isCorrect = null;
        let marksObtained = 0;

        if (question.type === "mcq" && answer?.text) {
          isCorrect = answer.text === question.correct_answer;
          if (isCorrect) {
            marksObtained = question.marks;
            totalMarks += marksObtained;
          }
        }

        // Upload image if exists
        let imageUrl = null;
        if (answer?.image) {
          const base64Data = answer.image.split(",")[1];
          const blob = await fetch(
            `data:image/jpeg;base64,${base64Data}`
          ).then((r) => r.blob());
          const fileName = `${initialSubmission.id}/${question.id}.jpg`;

          const { data: uploadData } = await supabase.storage
            .from("answer-images")
            .upload(fileName, blob, { upsert: true });

          if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from("answer-images")
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
          }
        }

        answerRecords.push({
          submission_id: initialSubmission.id,
          question_id: question.id,
          answer_text: answer?.text || null,
          answer_image_url: imageUrl,
          marks_obtained: marksObtained,
          is_correct: isCorrect,
        });
      }

      // Insert answers
      await supabase.from("answers").upsert(answerRecords, {
        onConflict: "submission_id,question_id",
      });

      // Update submission
      await supabase
        .from("submissions")
        .update({
          is_submitted: true,
          submitted_at: new Date().toISOString(),
          total_marks: totalMarks,
        })
        .eq("id", initialSubmission.id);

      // Clear localStorage
      localStorage.removeItem(`exam-${exam.id}-answers`);

      // Redirect to results
      router.push(`/student/results/${initialSubmission.id}`);
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitting(false);
    }
  }, [answers, exam.id, initialSubmission.id, questions, router]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">{exam.title}</h1>
              <p className="text-sm text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Timer
                durationMinutes={exam.duration}
                onTimeUp={handleTimeUp}
                startTime={startTime}
              />
              <Button
                onClick={() => setShowSubmitDialog(true)}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-2" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                  {currentIndex + 1}
                </span>
                <span>Question {currentIndex + 1}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={currentQuestion.type === "mcq" ? "default" : "outline"}>
                  {currentQuestion.type.toUpperCase()}
                </Badge>
                <Badge variant="secondary">
                  {currentQuestion.marks} mark{currentQuestion.marks > 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question */}
            <div className="text-lg">
              <LatexRenderer content={currentQuestion.question_text} />
            </div>

            {/* Question Image */}
            {currentQuestion.image_url && (
              <div className="rounded-xl overflow-hidden border bg-slate-100">
                <img
                  src={currentQuestion.image_url}
                  alt="Question"
                  className="max-h-64 mx-auto object-contain"
                />
              </div>
            )}

            {/* Answer Section */}
            {currentQuestion.type === "mcq" ? (
              <div className="grid gap-3">
                {currentQuestion.options?.map((option, i) => {
                  const isSelected = answers[currentQuestion.id]?.text === option;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                      }`}
                    >
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold shrink-0 ${
                          isSelected
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <LatexRenderer content={option} />
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-emerald-500 ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <ImageIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">
                        Written Answer Required
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Use your camera to capture a photo of your written answer
                      </p>
                    </div>
                  </div>
                </div>
                <CaptureButton
                  onCapture={(img) => handleImageCapture(currentQuestion.id, img)}
                  capturedImage={answers[currentQuestion.id]?.image}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => i - 1)}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-2 overflow-x-auto max-w-xs">
                {questions.map((q, i) => {
                  const hasAnswer = answers[q.id]?.text || answers[q.id]?.image;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium shrink-0 transition-all ${
                        i === currentIndex
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                          : hasAnswer
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => i + 1)}
                disabled={currentIndex === questions.length - 1}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Status */}
        <div className="mt-6 p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Answered: {answeredCount} of {questions.length}
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              {questions.length - answeredCount} unanswered
            </span>
          </div>
        </div>
      </main>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Submit Exam?
            </DialogTitle>
            <DialogDescription>
              You have answered {answeredCount} of {questions.length} questions.
              {questions.length - answeredCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: You have {questions.length - answeredCount} unanswered questions.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Continue Exam
            </Button>
            <Button onClick={() => { setShowSubmitDialog(false); handleSubmit(); }} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Exam"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
