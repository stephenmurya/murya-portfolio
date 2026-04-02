import { rename } from "node:fs/promises";
import { ProjectSchema } from "@/lib/schema/project";
import {
  createDevelopmentOnlyForbiddenResponse,
  getProjectFilePath,
  getProjectImageDirectoryPath,
  isDevelopmentEnvironment,
  pathExists,
  ProjectSlugSchema,
  remapProjectImageUrls,
  writeProjectFile,
} from "@/lib/cms/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isDevelopmentEnvironment()) {
    return createDevelopmentOnlyForbiddenResponse();
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedProject = ProjectSchema.safeParse(payload);

  if (!parsedProject.success) {
    return Response.json(
      {
        error: "Project validation failed.",
        issues: parsedProject.error.issues,
      },
      { status: 400 }
    );
  }

  const originalSlugHeader = request.headers.get("x-original-slug");
  const parsedOriginalSlug = originalSlugHeader
    ? ProjectSlugSchema.safeParse(originalSlugHeader)
    : null;

  if (parsedOriginalSlug && !parsedOriginalSlug.success) {
    return Response.json(
      {
        error: "Original project slug is invalid.",
        issues: parsedOriginalSlug.error.issues,
      },
      { status: 400 }
    );
  }

  const originalSlug = parsedOriginalSlug?.data ?? parsedProject.data.slug;
  const nextProject = remapProjectImageUrls(
    parsedProject.data,
    originalSlug,
    parsedProject.data.slug
  );
  const nextFilePath = getProjectFilePath(nextProject.slug);

  try {
    if (originalSlug !== nextProject.slug) {
      const originalFilePath = getProjectFilePath(originalSlug);
      const originalImageDirectory = getProjectImageDirectoryPath(originalSlug);
      const nextImageDirectory = getProjectImageDirectoryPath(nextProject.slug);

      if (await pathExists(nextFilePath)) {
        return Response.json(
          {
            error: `A project with slug "${nextProject.slug}" already exists.`,
          },
          { status: 409 }
        );
      }

      if (await pathExists(nextImageDirectory)) {
        return Response.json(
          {
            error: `An image directory for "${nextProject.slug}" already exists.`,
          },
          { status: 409 }
        );
      }

      if (await pathExists(originalFilePath)) {
        await rename(originalFilePath, nextFilePath);
      }

      if (await pathExists(originalImageDirectory)) {
        await rename(originalImageDirectory, nextImageDirectory);
      }
    }

    await writeProjectFile(nextProject);

    return Response.json({
      ok: true,
      slug: nextProject.slug,
      previousSlug: originalSlug,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to write project file.",
      },
      { status: 500 }
    );
  }
}
