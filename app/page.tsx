import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: FileText,
      title: "JSON Quiz Import",
      description: "Import quizzes instantly with structured JSON format",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Camera,
      title: "Camera Answers",
      description: "Capture written answers with your device camera",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Sparkles,
      title: "LaTeX Support",
      description: "Rich math equations rendered beautifully with KaTeX",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Clock,
      title: "Timed Exams",
      description: "Auto-submit when time runs out, never miss a deadline",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: CheckCircle2,
      title: "Instant Results",
      description: "MCQs graded automatically with detailed solutions",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Role-based access with Supabase authentication",
      color: "from-indigo-500 to-violet-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="glass fixed top-0 left-0 right-0 z-50 border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">ExamHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6 animate-fade-in">
            <Zap className="h-4 w-4" />
            Modern Online Examination Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Exams Made{" "}
            <span className="gradient-text">Simple</span>,{" "}
            <br className="hidden sm:block" />
            Results Made{" "}
            <span className="gradient-text">Clear</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 animate-fade-in">
            Create, take, and grade exams with LaTeX support, camera-based answer
            submission, and instant auto-grading.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-lg gap-2">
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need for{" "}
              <span className="gradient-text">Online Exams</span>
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              A complete examination platform designed for modern education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-lift">
                <CardContent className="p-6">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-4`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section className="py-20 px-4 bg-slate-50/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Built for <span className="gradient-text">Teachers & Students</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Teacher Card */}
            <Card className="hover-lift overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg mb-4">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">For Teachers</h3>
                <ul className="space-y-3">
                  {[
                    "Create rich quizzes with LaTeX",
                    "Import exams via JSON",
                    "Upload question images",
                    "Auto-grade MCQs instantly",
                    "Review written answers",
                    "Track student progress",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block mt-6">
                  <Button className="w-full">Create Teacher Account</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Student Card */}
            <Card className="hover-lift overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg mb-4">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">For Students</h3>
                <ul className="space-y-3">
                  {[
                    "Take exams online anytime",
                    "Clean, distraction-free UI",
                    "Submit camera-captured answers",
                    "View instant MCQ results",
                    "See solutions after exam",
                    "Track your progress",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block mt-6">
                  <Button variant="outline" className="w-full">
                    Create Student Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-indigo-100 mb-8 text-lg">
              Join ExamHub and experience the future of online examinations.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-lg gap-2"
              >
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-white/50">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold gradient-text">ExamHub</span>
          </div>
          <p>© 2024 ExamHub. Built with Next.js & Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
