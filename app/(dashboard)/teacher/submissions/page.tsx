import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function TeacherSubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      *,
      exam:exams(*),
      student:profiles(*)
    `)
    .eq("exams.teacher_id", user.id)
    .order("submitted_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">All Submissions</h1>
        <p className="text-slate-500 mt-1">
          View and grade student submissions across all exams
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Submissions ({submissions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600">
                No submissions yet
              </h3>
              <p className="text-slate-500 mt-1">
                Submissions will appear here once students take your exams
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.student?.full_name}</p>
                        <p className="text-xs text-slate-500">{submission.student?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/teacher/exams/${submission.exam_id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {submission.exam?.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={submission.is_submitted ? "success" : "warning"}>
                        {submission.is_submitted ? "Submitted" : "In Progress"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">{submission.total_marks}</span>
                    </TableCell>
                    <TableCell>
                      {submission.submitted_at ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="h-4 w-4" />
                          {new Date(submission.submitted_at).toLocaleString()}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
