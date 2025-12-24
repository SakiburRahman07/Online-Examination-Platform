import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LatexRenderer } from "@/components/latex-renderer";
import {
  ArrowLeft,
  Clock,
  FileText,
  Edit,
  Eye,
  EyeOff,
  Users,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: exam } = await supabase
    .from("exams")
    .select(`
      *,
      questions(*)
    `)
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();

  if (!exam) notFound();

  const questions = exam.questions?.sort(
    (a: { question_order: number }, b: { question_order: number }) => 
      a.question_order - b.question_order
  ) || [];

  const totalMarks = questions.reduce(
    (sum: number, q: { marks: number }) => sum + q.marks, 
    0
  );

  const togglePublish = async () => {
    "use server";
    const supabase = await createClient();
    await supabase
      .from("exams")
      .update({ is_published: !exam.is_published })
      .eq("id", id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exams
          </Link>
          <h1 className="text-3xl font-bold gradient-text">{exam.title}</h1>
          {exam.description && (
            <p className="text-slate-500">{exam.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={exam.is_published ? "success" : "secondary"} className="text-sm">
            {exam.is_published ? "Published" : "Draft"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Duration</p>
              <p className="font-bold">{exam.duration} min</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Questions</p>
              <p className="font-bold">{questions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Marks</p>
              <p className="font-bold">{totalMarks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Submissions</p>
              <p className="font-bold">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/teacher/exams/${id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Exam
          </Button>
        </Link>
        <form action={togglePublish}>
          <Button type="submit" variant={exam.is_published ? "secondary" : "default"} className="gap-2">
            {exam.is_published ? (
              <>
                <EyeOff className="h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </form>
        <Link href={`/teacher/exams/${id}/submissions`}>
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            View Submissions
          </Button>
        </Link>
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
          {questions.map((question: {
            id: string;
            question_order: number;
            type: string;
            question_text: string;
            marks: number;
            options?: string[];
            correct_answer?: string;
            solution?: string;
          }, index: number) => (
            <div key={question.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <LatexRenderer
                      content={question.question_text}
                      className="text-slate-700 dark:text-slate-200"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={question.type === "mcq" ? "default" : "outline"}>
                        {question.type.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">{question.marks} marks</Badge>
                    </div>
                  </div>

                  {question.type === "mcq" && question.options && (
                    <div className="grid sm:grid-cols-2 gap-2 mt-3">
                      {question.options.map((option: string, i: number) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border-2 ${
                            option === question.correct_answer
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {option}
                          {option === question.correct_answer && (
                            <CheckCircle className="inline-block h-4 w-4 text-green-600 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.solution && (
                    <div className="mt-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        Solution:
                      </p>
                      <LatexRenderer content={question.solution} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
