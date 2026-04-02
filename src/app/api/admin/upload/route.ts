import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import {
  createDevelopmentOnlyForbiddenResponse,
  getProjectImageDestination,
  isDevelopmentEnvironment,
  ProjectSlugSchema,
} from "@/lib/cms/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isDevelopmentEnvironment()) {
    return createDevelopmentOnlyForbiddenResponse();
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Invalid multipart form-data payload." },
      { status: 400 }
    );
  }

  const projectSlugResult = ProjectSlugSchema.safeParse(
    formData.get("projectSlug")
  );

  if (!projectSlugResult.success) {
    return Response.json(
      {
        error: "Invalid project slug.",
        issues: projectSlugResult.error.issues,
      },
      { status: 400 }
    );
  }

  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    return Response.json(
      { error: "A file upload is required." },
      { status: 400 }
    );
  }

  if (!fileEntry.name) {
    return Response.json(
      { error: "Uploaded file must include a filename." },
      { status: 400 }
    );
  }

  let destination: ReturnType<typeof getProjectImageDestination>;

  try {
    destination = getProjectImageDestination(
      projectSlugResult.data,
      fileEntry.name
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid upload target.",
      },
      { status: 400 }
    );
  }

  try {
    await mkdir(destination.directoryPath, { recursive: true });
    await pipeline(
      Readable.fromWeb(fileEntry.stream() as NodeReadableStream),
      createWriteStream(destination.filePath)
    );

    return Response.json({ url: destination.publicUrl });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save upload.",
      },
      { status: 500 }
    );
  }
}
