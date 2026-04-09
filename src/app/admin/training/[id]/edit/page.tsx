import { notFound } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";

export default async function AdminTrainingEditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id?.trim()) notFound();

  return <CourseForm mode="edit" courseId={id.trim()} />;
}
