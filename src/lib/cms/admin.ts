import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Block, Project } from "@/lib/schema/project";

export const ProjectSlugSchema = z
  .string()
  .trim()
  .min(1, "Project slug is required.")
  .regex(
    /^[A-Za-z0-9_-]+$/u,
    "Project slug may only contain letters, numbers, hyphens, and underscores."
  );

export const CommitMessageSchema = z
  .string()
  .trim()
  .min(1, "Commit message is required.")
  .max(120, "Commit message must be 120 characters or fewer.");

const projectsDirectory = path.join(process.cwd(), "src/content/projects");
const projectImagesRootDirectory = path.join(
  process.cwd(),
  "public/images/projects"
);

function assertPathWithinRoot(rootPath: string, filePath: string, message: string) {
  if (!filePath.startsWith(path.resolve(rootPath))) {
    throw new Error(message);
  }
}

export function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === "development";
}

export function createDevelopmentOnlyForbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function getProjectFilePath(projectSlug: string) {
  const safeSlug = ProjectSlugSchema.parse(projectSlug);
  const filePath = path.resolve(projectsDirectory, `${safeSlug}.json`);

  assertPathWithinRoot(
    projectsDirectory,
    filePath,
    "Resolved project file path is outside the content directory."
  );

  return filePath;
}

export function getProjectImageDirectoryPath(projectSlug: string) {
  const safeSlug = ProjectSlugSchema.parse(projectSlug);
  const directoryPath = path.resolve(projectImagesRootDirectory, safeSlug);

  assertPathWithinRoot(
    projectImagesRootDirectory,
    directoryPath,
    "Resolved project image path is outside the public images directory."
  );

  return directoryPath;
}

export function sanitizeUploadFilename(fileName: string) {
  const rawExtension = path.extname(fileName).toLowerCase();
  const extension = rawExtension.replace(/[^a-z0-9.]/gu, "");
  const safeExtension = extension === "." ? "" : extension;
  const baseName = path
    .basename(fileName, rawExtension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return `${baseName || "upload"}${safeExtension}`;
}

export function getProjectImageDestination(
  projectSlug: string,
  originalFileName: string
) {
  const safeSlug = ProjectSlugSchema.parse(projectSlug);
  const safeFileName = sanitizeUploadFilename(originalFileName);
  const directoryPath = getProjectImageDirectoryPath(safeSlug);
  const filePath = path.resolve(directoryPath, safeFileName);

  assertPathWithinRoot(
    projectImagesRootDirectory,
    filePath,
    "Resolved upload path is outside the public images directory."
  );

  return {
    directoryPath,
    filePath,
    publicUrl: `/images/projects/${safeSlug}/${safeFileName}`,
  };
}

export function sanitizeCommitMessage(message: string) {
  const safeMessage = CommitMessageSchema.parse(message)
    .normalize("NFKC")
    .replace(/[^A-Za-z0-9 .,!?:;()[\]_'/-]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  if (!safeMessage) {
    throw new Error("Commit message cannot be empty after sanitization.");
  }

  return safeMessage;
}

export async function pathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function rewriteProjectImageUrl(value: string, sourceSlug: string, targetSlug: string) {
  const sourcePrefix = `/images/projects/${sourceSlug}/`;

  if (!value.startsWith(sourcePrefix)) {
    return value;
  }

  return value.replace(sourcePrefix, `/images/projects/${targetSlug}/`);
}

function rewriteBlockImageUrls(block: Block, sourceSlug: string, targetSlug: string): Block {
  switch (block.type) {
    case "hero":
      return {
        ...block,
        coverImage: rewriteProjectImageUrl(block.coverImage, sourceSlug, targetSlug),
      };
    case "side-by-side":
      return {
        ...block,
        image: rewriteProjectImageUrl(block.image, sourceSlug, targetSlug),
      };
    case "gallery":
      return {
        ...block,
        images: block.images.map((image) =>
          rewriteProjectImageUrl(image, sourceSlug, targetSlug)
        ),
      };
    case "text":
      return block;
    default: {
      const exhaustiveCheck: never = block;

      return exhaustiveCheck;
    }
  }
}

export function remapProjectImageUrls(
  project: Project,
  sourceSlug: string,
  targetSlug: string
): Project {
  if (sourceSlug === targetSlug) {
    return project;
  }

  return {
    ...project,
    thumbnail: rewriteProjectImageUrl(project.thumbnail, sourceSlug, targetSlug),
    blocks: project.blocks.map((block) =>
      rewriteBlockImageUrls(block, sourceSlug, targetSlug)
    ),
  };
}

export async function writeProjectFile(project: Project) {
  const filePath = getProjectFilePath(project.slug);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(project, null, 2)}\n`, "utf8");
}

export function createEmptyProject(slug: string): Project {
  const safeSlug = ProjectSlugSchema.parse(slug);

  return {
    slug: safeSlug,
    title: "Untitled Project",
    date: new Date().toISOString().slice(0, 10),
    category: "Product Design",
    thumbnail: "/og-image.png",
    isDraft: true,
    blocks: [],
  };
}
