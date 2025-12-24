import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Users, Clock, Eye, CheckCircle, XCircle } from "lucide-react";

export default async function ExamSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get exam
  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();

  if (!exam) notFound();

  // Get submissions with student info
  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      *,
      student:profiles(*),
      answers(*, question:questions(*))
    `)
    .eq("exam_id", id)
    .order("submitted_at", { ascending: false });

  // Calculate max possible marks
  const { data: questions } = await supabase
    .from("questions")
    .select("marks")
    .eq("exam_id", id);

  const maxMarks = questions?.reduce((sum, q) => sum + q.marks, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href={`/teacher/exams/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exam
        </Link>
        <h1 className="text-3xl font-bold gradient-text">{exam.title}</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Student Submissions ({submissions?.length || 0})
        </p>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                No submissions yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Submissions will appear here once students take this exam
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Written Qs</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const writtenAnswers = submission.answers?.filter(
                    (a: { question: { type: string } }) => a.question?.type === "written"
                  ) || [];
                  const ungradedCount = writtenAnswers.filter(
                    (a: { marks_obtained: number; question: { type: string } }) => 
                      a.question?.type === "written" && a.marks_obtained === 0
                  ).length;

                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.student?.full_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {submission.student?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={submission.is_submitted ? "success" : "warning"}>
                          {submission.is_submitted ? "Submitted" : "In Progress"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{submission.total_marks}</span>
                        <span className="text-slate-500 dark:text-slate-400">/{maxMarks}</span>
                      </TableCell>
                      <TableCell>
                        {writtenAnswers.length > 0 ? (
                          ungradedCount > 0 ? (
                            <Badge variant="warning">
                              {ungradedCount} ungraded
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              All graded
                            </Badge>
                          )
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.submitted_at ? (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Clock className="h-4 w-4" />
                            {new Date(submission.submitted_at).toLocaleString()}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/teacher/exams/${id}/submissions/${submission.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            Review
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
