import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LatexRenderer } from "@/components/latex-renderer";
import {
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get submission with exam and answers
  const { data: submission } = await supabase
    .from("submissions")
    .select(`
      *,
      exam:exams(*),
      answers(*, question:questions(*))
    `)
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (!submission) notFound();

  const answers = submission.answers?.sort(
    (a: { question: { question_order: number } }, b: { question: { question_order: number } }) =>
      a.question.question_order - b.question.question_order
  ) || [];

  // Calculate stats
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(
    (a: { is_correct: boolean }) => a.is_correct === true
  ).length;
  const totalMarks = answers.reduce(
    (sum: number, a: { question: { marks: number } }) => sum + a.question.marks,
    0
  );
  const percentage = totalMarks > 0 ? (submission.total_marks / totalMarks) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/student/results"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>
        <h1 className="text-3xl font-bold gradient-text">{submission.exam?.title}</h1>
        <p className="text-slate-500">
          Submitted {new Date(submission.submitted_at).toLocaleString()}
        </p>
      </div>

      {/* Score Card */}
      <Card className="overflow-hidden">
        <div
          className={`h-2 ${
            percentage >= 70
              ? "bg-gradient-to-r from-emerald-500 to-green-500"
              : percentage >= 50
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-red-500 to-rose-500"
          }`}
        />
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-bold">{submission.total_marks}</p>
              <p className="text-sm text-slate-500">out of {totalMarks}</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-bold">{correctAnswers}</p>
              <p className="text-sm text-slate-500">correct</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-bold">{totalQuestions}</p>
              <p className="text-sm text-slate-500">questions</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-bold">{Math.round(percentage)}%</p>
              <p className="text-sm text-slate-500">score</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Overall Progress</span>
              <span className="font-medium">{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questions &amp; Solutions
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
          {answers.map((answer: {
            id: string;
            question: {
              id: string;
              question_order: number;
              type: string;
              question_text: string;
              marks: number;
              options?: string[];
              correct_answer?: string;
              solution?: string;
              image_url?: string;
            };
            answer_text?: string;
            answer_image_url?: string;
            is_correct?: boolean;
            marks_obtained: number;
          }, index: number) => (
            <div key={answer.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                {/* Question Number */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                    answer.is_correct
                      ? "bg-gradient-to-br from-emerald-500 to-green-500"
                      : answer.is_correct === false
                      ? "bg-gradient-to-br from-red-500 to-rose-500"
                      : "bg-gradient-to-br from-slate-400 to-slate-500"
                  }`}
                >
                  {index + 1}
                </div>

                <div className="flex-1 space-y-3">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={answer.question.type === "mcq" ? "default" : "outline"}>
                        {answer.question.type.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={answer.is_correct ? "success" : answer.is_correct === false ? "destructive" : "secondary"}
                      >
                        {answer.is_correct ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Correct</>
                        ) : answer.is_correct === false ? (
                          <><XCircle className="h-3 w-3 mr-1" /> Incorrect</>
                        ) : (
                          "Pending Review"
                        )}
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {answer.marks_obtained}/{answer.question.marks} marks
                    </Badge>
                  </div>

                  {/* Question Text */}
                  <LatexRenderer
                    content={answer.question.question_text}
                    className="text-slate-700 dark:text-slate-200"
                  />

                  {/* Question Image */}
                  {answer.question.image_url && (
                    <img
                      src={answer.question.image_url}
                      alt="Question"
                      className="max-h-48 rounded-lg border"
                    />
                  )}

                  {/* MCQ Options */}
                  {answer.question.type === "mcq" && answer.question.options && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {answer.question.options.map((option: string, i: number) => {
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
                  )}

                  {/* Written Answer Image */}
                  {answer.question.type === "written" && answer.answer_image_url && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-600">Your Answer:</p>
                      <img
                        src={answer.answer_image_url}
                        alt="Your answer"
                        className="max-h-64 rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Solution */}
                  {answer.question.solution && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        Solution
                      </p>
                      <LatexRenderer content={answer.question.solution} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="text-center">
        <Link href="/student/results">
          <Button variant="outline" size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
        </Link>
      </div>
    </div>
  );
}
