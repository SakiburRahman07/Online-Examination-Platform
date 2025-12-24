import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  PlusCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch teacher's stats
  const { data: exams } = await supabase
    .from("exams")
    .select("*, questions(count)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, exams!inner(*)")
    .eq("exams.teacher_id", user.id);

  const totalExams = exams?.length || 0;
  const publishedExams = exams?.filter((e) => e.is_published).length || 0;
  const totalSubmissions = submissions?.length || 0;
  const recentExams = exams?.slice(0, 5) || [];

  const stats = [
    {
      title: "Total Exams",
      value: totalExams,
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Published",
      value: publishedExams,
      icon: CheckCircle2,
      color: "from-emerald-500 to-green-500",
    },
    {
      title: "Submissions",
      value: totalSubmissions,
      icon: Users,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Draft Exams",
      value: totalExams - publishedExams,
      icon: Clock,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Teacher Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Manage your exams and view student submissions
          </p>
        </div>
        <Link href="/teacher/exams/create">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Exam
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Exams */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Exams
          </CardTitle>
          <Link href="/teacher/exams">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentExams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600">
                No exams yet
              </h3>
              <p className="text-slate-500 mt-1 mb-4">
                Create your first exam to get started
              </p>
              <Link href="/teacher/exams/create">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentExams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/teacher/exams/${exam.id}`}
                  className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-slate-500">
                        {exam.duration} min • {exam.questions?.[0]?.count || 0} questions
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={exam.is_published ? "success" : "secondary"}
                  >
                    {exam.is_published ? "Published" : "Draft"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
