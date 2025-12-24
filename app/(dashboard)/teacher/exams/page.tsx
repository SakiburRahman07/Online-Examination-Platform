import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  Users,
} from "lucide-react";

export default async function TeacherExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: exams } = await supabase
    .from("exams")
    .select(`
      *,
      questions(count),
      submissions(count)
    `)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">My Exams</h1>
          <p className="text-slate-500 mt-1">
            Manage all your exams and quizzes
          </p>
        </div>
        <Link href="/teacher/exams/create">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Exam
          </Button>
        </Link>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Exams ({exams?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!exams || exams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600">
                No exams found
              </h3>
              <p className="text-slate-500 mt-1 mb-4">
                Start by creating your first exam
              </p>
              <Link href="/teacher/exams/create">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(exam.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="h-4 w-4" />
                        {exam.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      {exam.questions?.[0]?.count || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Users className="h-4 w-4" />
                        {exam.submissions?.[0]?.count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={exam.is_published ? "success" : "secondary"}
                      >
                        {exam.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/teacher/exams/${exam.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/teacher/exams/${exam.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
