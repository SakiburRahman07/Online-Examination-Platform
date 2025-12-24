import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import SubmissionReviewClient from "./review-client";

export default async function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
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

  // Get submission with answers
  const { data: submission } = await supabase
    .from("submissions")
    .select(`
      *,
      student:profiles(*),
      answers(*, question:questions(*))
    `)
    .eq("id", submissionId)
    .eq("exam_id", id)
    .single();

  if (!submission) notFound();

  return <SubmissionReviewClient submission={submission} exam={exam} />;
}
