import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  createEmptyProject,
  getProjectFilePath,
  pathExists,
  writeProjectFile,
} from "@/lib/cms/admin";

export const dynamic = "force-dynamic";

async function generateUniqueProjectSlug() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = `project-${randomUUID()}`;

    if (!(await pathExists(getProjectFilePath(slug)))) {
      return slug;
    }
  }

  throw new Error("Unable to generate a unique project slug.");
}

export default async function NewProjectPage() {
  const slug = await generateUniqueProjectSlug();

  await writeProjectFile(createEmptyProject(slug));
  redirect(`/admin/projects/${slug}`);
}
