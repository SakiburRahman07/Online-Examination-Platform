import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, AlertCircle, PlayCircle, ArrowLeft } from "lucide-react";
import ExamTakingClient from "./exam-client";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get exam with questions
  const { data: exam } = await supabase
    .from("exams")
    .select(`
      *,
      questions(*)
    `)
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!exam) notFound();

  const questions = exam.questions?.sort(
    (a: { question_order: number }, b: { question_order: number }) =>
      a.question_order - b.question_order
  ) || [];

  // Check for existing submission
  const { data: existingSubmission } = await supabase
    .from("submissions")
    .select("*")
    .eq("exam_id", id)
    .eq("student_id", user.id)
    .single();

  // If already submitted, redirect to results
  if (existingSubmission?.is_submitted) {
    redirect(`/student/results/${existingSubmission.id}`);
  }

  // If submission exists but not started, show exam
  if (existingSubmission) {
    return <ExamTakingClient exam={exam} questions={questions} submission={existingSubmission} />;
  }

  // Show exam overview - start exam button
  const totalMarks = questions.reduce(
    (sum: number, q: { marks: number }) => sum + q.marks,
    0
  );

  async function startExam() {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Create submission
    await supabase.from("submissions").insert({
      exam_id: id,
      student_id: user.id,
      started_at: new Date().toISOString(),
    });

    // Redirect to same page (will now show exam)
    redirect(`/student/exams/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/student/exams"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Exams
      </Link>

      <Card className="shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardHeader className="text-center pb-2">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
          {exam.description && (
            <p className="text-slate-500 mt-2">{exam.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Info */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{exam.duration}</p>
              <p className="text-xs text-slate-500">Minutes</p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-slate-700">
              <p className="text-2xl font-bold text-emerald-600">{questions.length}</p>
              <p className="text-xs text-slate-500">Questions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{totalMarks}</p>
              <p className="text-xs text-slate-500">Marks</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-2">Before you start:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                  <li>Once started, the timer cannot be paused</li>
                  <li>Exam will auto-submit when time runs out</li>
                  <li>Written answers require camera access</li>
                  <li>Make sure you have a stable internet connection</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <form action={startExam}>
            <Button type="submit" size="lg" className="w-full gap-2 h-14 text-lg">
              <PlayCircle className="h-6 w-6" />
              Start Exam
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
