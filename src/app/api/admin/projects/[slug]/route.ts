import { rm, unlink } from "node:fs/promises";
import { z } from "zod";
import { getProjectBySlug } from "@/lib/cms/api";
import {
  createDevelopmentOnlyForbiddenResponse,
  getProjectFilePath,
  getProjectImageDirectoryPath,
  isDevelopmentEnvironment,
  writeProjectFile,
} from "@/lib/cms/admin";

const DraftToggleSchema = z.object({
  isDraft: z.boolean(),
});

export const runtime = "nodejs";

type AdminProjectRouteContext = {
  params: Promise<{ slug: string }>;
};

function isMissingFileError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
  );
}

export async function PATCH(
  request: Request,
  { params }: AdminProjectRouteContext
) {
  if (!isDevelopmentEnvironment()) {
    return createDevelopmentOnlyForbiddenResponse();
  }

  const { slug } = await params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedPayload = DraftToggleSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return Response.json(
      {
        error: "Project update validation failed.",
        issues: parsedPayload.error.issues,
      },
      { status: 400 }
    );
  }

  try {
    const project = await getProjectBySlug(slug);
    const updatedProject = {
      ...project,
      isDraft: parsedPayload.data.isDraft,
    };

    await writeProjectFile(updatedProject);

    return Response.json({
      ok: true,
      project: updatedProject,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Project file not found:")
    ) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update project.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: AdminProjectRouteContext
) {
  if (!isDevelopmentEnvironment()) {
    return createDevelopmentOnlyForbiddenResponse();
  }

  const { slug } = await params;
  let filePath: string;
  let imageDirectoryPath: string;

  try {
    filePath = getProjectFilePath(slug);
    imageDirectoryPath = getProjectImageDirectoryPath(slug);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Invalid project slug.",
      },
      { status: 400 }
    );
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete project file.",
      },
      { status: 500 }
    );
  }

  try {
    await rm(imageDirectoryPath, { recursive: true, force: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Project file was removed, but deleting images failed.",
      },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    slug,
  });
}
