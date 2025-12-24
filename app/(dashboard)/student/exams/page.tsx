import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Users, PlayCircle, CheckCircle } from "lucide-react";

export default async function StudentExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get all published exams with question count
  const { data: exams } = await supabase
    .from("exams")
    .select(`
      *,
      questions(count),
      teacher:profiles(full_name)
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Get student's submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", user.id);

  const getExamStatus = (examId: string) => {
    const submission = submissions?.find((s) => s.exam_id === examId);
    if (!submission) return "available";
    return submission.is_submitted ? "completed" : "ongoing";
  };

  const getSubmissionId = (examId: string) => {
    return submissions?.find((s) => s.exam_id === examId)?.id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Available Exams</h1>
        <p className="text-slate-500 mt-1">
          Browse and take exams from your teachers
        </p>
      </div>

      {/* Exams Grid */}
      {!exams || exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">
              No exams available
            </h3>
            <p className="text-slate-500 mt-1">
              Check back later for new exams from your teachers
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const status = getExamStatus(exam.id);
            const submissionId = getSubmissionId(exam.id);
            const questionCount = exam.questions?.[0]?.count || 0;

            return (
              <Card key={exam.id} className="hover-lift overflow-hidden">
                <div
                  className={`h-2 ${
                    status === "completed"
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : status === "ongoing"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500"
                  }`}
                />
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <Badge
                        variant={
                          status === "completed"
                            ? "success"
                            : status === "ongoing"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {status === "completed"
                          ? "Completed"
                          : status === "ongoing"
                          ? "In Progress"
                          : "Available"}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="font-bold text-lg">{exam.title}</h3>
                      {exam.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exam.duration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {questionCount} questions
                      </div>
                    </div>

                    {/* Teacher */}
                    <p className="text-xs text-slate-400">
                      By {exam.teacher?.full_name || "Teacher"}
                    </p>

                    {/* Action */}
                    <Link
                      href={
                        status === "completed"
                          ? `/student/results/${submissionId}`
                          : `/student/exams/${exam.id}`
                      }
                      className="block"
                    >
                      <Button
                        className="w-full gap-2"
                        variant={status === "completed" ? "outline" : "default"}
                      >
                        {status === "completed" ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            View Results
                          </>
                        ) : status === "ongoing" ? (
                          <>
                            <PlayCircle className="h-4 w-4" />
                            Continue Exam
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4" />
                            Start Exam
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
