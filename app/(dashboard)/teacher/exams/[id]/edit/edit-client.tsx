"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LatexRenderer } from "@/components/latex-renderer";
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { Exam, Question, QuestionType } from "@/lib/types";

interface QuestionForm {
  id?: string;
  type: QuestionType;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  solution: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

export default function EditExamClient({
  exam,
  questions: initialQuestions,
}: {
  exam: Exam;
  questions: Question[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Exam details
  const [title, setTitle] = useState(exam.title);
  const [description, setDescription] = useState(exam.description || "");
  const [duration, setDuration] = useState(exam.duration);

  // Questions
  const [questions, setQuestions] = useState<QuestionForm[]>(
    initialQuestions.map((q) => ({
      id: q.id,
      type: q.type,
      question_text: q.question_text,
      options: q.options || ["", "", "", ""],
      correct_answer: q.correct_answer || "",
      marks: q.marks,
      solution: q.solution || "",
    }))
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "mcq",
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: "",
        marks: 1,
        solution: "",
        isNew: true,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const updated = [...questions];
    if (updated[index].id) {
      updated[index].isDeleted = true;
    } else {
      updated.splice(index, 1);
    }
    setQuestions(updated);
  };

  const updateQuestion = (index: number, updates: Partial<QuestionForm>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...updated[questionIndex].options];
    options[optionIndex] = value;
    updated[questionIndex].options = options;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Update exam details
      const { error: examError } = await supabase
        .from("exams")
        .update({
          title,
          description,
          duration,
        })
        .eq("id", exam.id);

      if (examError) throw examError;

      // Handle questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        if (q.isDeleted && q.id) {
          // Delete existing question
          await supabase.from("questions").delete().eq("id", q.id);
        } else if (q.isNew) {
          // Insert new question
          await supabase.from("questions").insert({
            exam_id: exam.id,
            question_order: i + 1,
            type: q.type,
            question_text: q.question_text,
            options: q.type === "mcq" ? q.options.filter(Boolean) : null,
            correct_answer: q.type === "mcq" ? q.correct_answer : null,
            marks: q.marks,
            solution: q.solution || null,
          });
        } else if (q.id) {
          // Update existing question
          await supabase
            .from("questions")
            .update({
              question_order: i + 1,
              type: q.type,
              question_text: q.question_text,
              options: q.type === "mcq" ? q.options.filter(Boolean) : null,
              correct_answer: q.type === "mcq" ? q.correct_answer : null,
              marks: q.marks,
              solution: q.solution || null,
            })
            .eq("id", q.id);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/teacher/exams/${exam.id}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save exam");
    } finally {
      setLoading(false);
    }
  };

  const visibleQuestions = questions.filter((q) => !q.isDeleted);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href={`/teacher/exams/${exam.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exam
        </Link>
        <h1 className="text-3xl font-bold gradient-text">Edit Exam</h1>
        <div className="flex items-center gap-2">
          <Badge variant={exam.is_published ? "success" : "secondary"}>
            {exam.is_published ? "Published" : "Draft"}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5 shrink-0" />
          Exam saved successfully!
        </div>
      )}

      {/* Exam Details */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>Basic information about your exam</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Physics Midterm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the exam..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Questions ({visibleQuestions.length})</h2>
          <Button variant="outline" onClick={addQuestion} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Question
          </Button>
        </div>

        {visibleQuestions.map((question, visibleIndex) => {
          const actualIndex = questions.findIndex((q) => q === question);
          return (
            <Card key={actualIndex} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Question {visibleIndex + 1}
                    {question.isNew && (
                      <Badge variant="outline" className="text-xs">New</Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(actualIndex)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value: QuestionType) =>
                        updateQuestion(actualIndex, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="written">Written Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      value={question.marks}
                      onChange={(e) =>
                        updateQuestion(actualIndex, {
                          marks: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question Text (supports LaTeX: $formula$)</Label>
                  <Textarea
                    value={question.question_text}
                    onChange={(e) =>
                      updateQuestion(actualIndex, { question_text: e.target.value })
                    }
                    placeholder="Enter your question here..."
                    className="min-h-[100px]"
                  />
                  {question.question_text && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Preview:</p>
                      <LatexRenderer content={question.question_text} />
                    </div>
                  )}
                </div>

                {question.type === "mcq" && (
                  <div className="space-y-3">
                    <Label>Options</Label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium shrink-0">
                          {String.fromCharCode(65 + oIndex)}
                        </span>
                        <Input
                          value={option}
                          onChange={(e) =>
                            updateOption(actualIndex, oIndex, e.target.value)
                          }
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        />
                      </div>
                    ))}
                    <div className="space-y-2 mt-4">
                      <Label>Correct Answer</Label>
                      <Select
                        value={question.correct_answer}
                        onValueChange={(value) =>
                          updateQuestion(actualIndex, { correct_answer: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options.filter(Boolean).map((option, i) => (
                            <SelectItem key={i} value={option}>
                              {String.fromCharCode(65 + i)}: {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Solution/Explanation (optional)</Label>
                  <Textarea
                    value={question.solution}
                    onChange={(e) =>
                      updateQuestion(actualIndex, { solution: e.target.value })
                    }
                    placeholder="Explain the solution..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Link href={`/teacher/exams/${exam.id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading || !title} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
