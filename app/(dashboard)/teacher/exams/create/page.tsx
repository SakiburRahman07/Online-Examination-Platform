"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Upload,
  Trash2,
  Loader2,
  FileJson,
  FormInput,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
} from "lucide-react";
import { LatexRenderer } from "@/components/latex-renderer";
import { QuestionImageUpload } from "@/components/question-image-upload";
import type { QuizImport, QuestionType } from "@/lib/types";

interface QuestionForm {
  type: QuestionType;
  question_text: string;
  image_url?: string;
  options: string[];
  correct_answer: string;
  marks: number;
  solution: string;
}

const emptyQuestion: QuestionForm = {
  type: "mcq",
  question_text: "",
  options: ["", "", "", ""],
  correct_answer: "",
  marks: 1,
  solution: "",
};

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Exam details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);

  // Questions
  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);

  // JSON Import
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
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

  const handleJsonImport = () => {
    setJsonError(null);
    try {
      const parsed: QuizImport = JSON.parse(jsonInput);

      // Validate structure
      if (!parsed.title || !parsed.duration || !parsed.questions?.length) {
        throw new Error("Invalid JSON structure. Required: title, duration, questions");
      }

      // Set exam details
      setTitle(parsed.title);
      setDescription(parsed.description || "");
      setDuration(parsed.duration);

      // Convert questions
      const convertedQuestions: QuestionForm[] = parsed.questions.map((q) => ({
        type: q.type,
        question_text: q.question,
        image_url: q.image,
        options: q.options || ["", "", "", ""],
        correct_answer: q.correctAnswer || "",
        marks: q.marks,
        solution: q.solution || "",
      }));

      setQuestions(convertedQuestions);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleSubmit = async (publish: boolean = false) => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Create exam
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          teacher_id: user.id,
          title,
          description,
          duration,
          is_published: publish,
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create questions
      const questionsToInsert = questions.map((q, index) => ({
        exam_id: exam.id,
        question_order: index + 1,
        type: q.type,
        question_text: q.question_text,
        image_url: q.image_url || null,
        options: q.type === "mcq" ? q.options.filter(Boolean) : null,
        correct_answer: q.type === "mcq" ? q.correct_answer : null,
        marks: q.marks,
        solution: q.solution || null,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      router.push(`/teacher/exams/${exam.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Create New Exam</h1>
        <p className="text-slate-500 mt-1">
          Create an exam manually or import from JSON
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="gap-2">
            <FormInput className="h-4 w-4" />
            Manual Creation
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-2">
            <FileJson className="h-4 w-4" />
            JSON Import
          </TabsTrigger>
        </TabsList>

        {/* JSON Import Tab */}
        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle>Import from JSON</CardTitle>
              <CardDescription>
                Paste your quiz JSON to automatically generate questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>JSON Content</Label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`{
  "title": "Physics Midterm",
  "duration": 60,
  "questions": [
    {
      "type": "mcq",
      "question": "What is the value of $\\\\frac{d}{dx}(x^2)$?",
      "options": ["x", "2x", "x^2", "2"],
      "correctAnswer": "2x",
      "marks": 1,
      "solution": "Using power rule..."
    }
  ]
}`}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {jsonError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {jsonError}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  JSON imported successfully! Review the questions below.
                </div>
              )}

              <Button onClick={handleJsonImport} className="gap-2">
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Creation Tab */}
        <TabsContent value="manual" className="space-y-6">
          {/* Exam Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>
                Basic information about your exam
              </CardDescription>
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
        </TabsContent>
      </Tabs>

      {/* Questions Section (Always visible) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
          <Button variant="outline" onClick={addQuestion} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Question
          </Button>
        </div>

        {questions.map((question, qIndex) => (
          <Card key={qIndex} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value: QuestionType) =>
                      updateQuestion(qIndex, { type: value })
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
                      updateQuestion(qIndex, { marks: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question Text (supports LaTeX: $formula$)</Label>
                <Textarea
                  value={question.question_text}
                  onChange={(e) =>
                    updateQuestion(qIndex, { question_text: e.target.value })
                  }
                  placeholder="Enter your question here..."
                  className="min-h-[100px]"
                />
                {question.question_text && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-2">Preview:</p>
                    <LatexRenderer content={question.question_text} />
                  </div>
                )}
              </div>

              {/* Question Image Upload */}
              <QuestionImageUpload
                imageUrl={question.image_url}
                onImageChange={(url) => updateQuestion(qIndex, { image_url: url || undefined })}
                questionIndex={qIndex}
              />

              {question.type === "mcq" && (
                <div className="space-y-3">
                  <Label>Options</Label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium shrink-0">
                        {String.fromCharCode(65 + oIndex)}
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      />
                    </div>
                  ))}
                  <div className="space-y-2 mt-4">
                    <Label>Correct Answer</Label>
                    <Select
                      value={question.correct_answer}
                      onValueChange={(value) =>
                        updateQuestion(qIndex, { correct_answer: value })
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
                    updateQuestion(qIndex, { solution: e.target.value })
                  }
                  placeholder="Explain the solution..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={() => handleSubmit(false)}
          variant="outline"
          disabled={loading || !title}
          className="flex-1 gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={loading || !title}
          className="flex-1 gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Publish Exam
        </Button>
      </div>
    </div>
  );
}
