import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EditExamClient from "./edit-client";

export default async function EditExamPage({
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
    .eq("teacher_id", user.id)
    .single();

  if (!exam) notFound();

  const questions = exam.questions?.sort(
    (a: { question_order: number }, b: { question_order: number }) =>
      a.question_order - b.question_order
  ) || [];

  return <EditExamClient exam={exam} questions={questions} />;
}
