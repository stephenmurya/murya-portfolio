import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/ProjectEditor";
import { getProjectBySlug } from "@/lib/cms/api";

type AdminProjectEditorPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminProjectEditorPage({
  params,
}: AdminProjectEditorPageProps) {
  const { slug } = await params;
  let project;

  try {
    project = await getProjectBySlug(slug);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Project file not found:")
    ) {
      notFound();
    }

    throw error;
  }

  return <ProjectEditor initialProject={project} />;
}
