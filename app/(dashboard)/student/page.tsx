import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Trophy,
  Clock,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get available exams (published exams)
  const { data: availableExams } = await supabase
    .from("exams")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Get student's submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, exam:exams(*)")
    .eq("student_id", user.id);

  const completedExams = submissions?.filter((s) => s.is_submitted).length || 0;
  const ongoingExams = submissions?.filter((s) => !s.is_submitted).length || 0;
  const totalScore = submissions
    ?.filter((s) => s.is_submitted)
    .reduce((sum, s) => sum + (s.total_marks || 0), 0) || 0;

  const recentExams = availableExams?.slice(0, 3) || [];

  const stats = [
    {
      title: "Available Exams",
      value: availableExams?.length || 0,
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Completed",
      value: completedExams,
      icon: CheckCircle2,
      color: "from-emerald-500 to-green-500",
    },
    {
      title: "In Progress",
      value: ongoingExams,
      icon: Clock,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Total Score",
      value: totalScore,
      icon: Trophy,
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          Welcome, {profile?.full_name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-slate-500 mt-1">
          Ready to take an exam? Check out the available exams below.
        </p>
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

      {/* Available Exams */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Available Exams
          </CardTitle>
          <Link href="/student/exams">
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
                No exams available
              </h3>
              <p className="text-slate-500 mt-1">
                Check back later for new exams
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentExams.map((exam) => {
                const submission = submissions?.find(
                  (s) => s.exam_id === exam.id
                );
                const status = submission
                  ? submission.is_submitted
                    ? "completed"
                    : "ongoing"
                  : "available";

                return (
                  <Card key={exam.id} className="hover-lift border-2 border-transparent hover:border-emerald-200">
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
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
                            {status === "completed"
                              ? "Completed"
                              : status === "ongoing"
                              ? "In Progress"
                              : "Available"}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold">{exam.title}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {exam.duration} minutes
                          </p>
                        </div>
                        <Link
                          href={
                            status === "completed"
                              ? `/student/results/${submission?.id}`
                              : `/student/exams/${exam.id}`
                          }
                        >
                          <Button
                            className="w-full"
                            variant={status === "completed" ? "outline" : "default"}
                          >
                            {status === "completed"
                              ? "View Results"
                              : status === "ongoing"
                              ? "Continue"
                              : "Start Exam"}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
