import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { ProjectSchema, type Project } from "@/lib/schema/project";

const projectsDirectory = path.join(process.cwd(), "src/content/projects");

function formatProjectIssues(error: ZodError, filePath: string) {
  const issues = error.issues
    .map((issue) => {
      const issuePath = issue.path.length > 0 ? issue.path.join(".") : "root";

      return `- ${issuePath}: ${issue.message}`;
    })
    .join("\n");

  return `Invalid project schema in ${filePath}.\n${issues}`;
}

function isDevelopmentMode() {
  return process.env.NODE_ENV === "development";
}

function getProjectSortValue(project: Project) {
  const parsedDate = Date.parse(project.date);

  return Number.isNaN(parsedDate) ? Number.NEGATIVE_INFINITY : parsedDate;
}

async function readProjectFromFile(slug: string): Promise<Project> {
  const filePath = path.join(projectsDirectory, `${slug}.json`);
  const relativePath = path.relative(process.cwd(), filePath);
  let fileContents: string;

  try {
    fileContents = await readFile(filePath, "utf8");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(`Project file not found: ${relativePath}`);
    }

    throw error;
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(fileContents);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
    }

    throw error;
  }

  try {
    const project = ProjectSchema.parse(parsedJson);

    if (project.slug !== slug) {
      throw new Error(
        `Project slug mismatch in ${relativePath}: expected "${slug}" but found "${project.slug}".`
      );
    }

    return project;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatProjectIssues(error, relativePath), {
        cause: error,
      });
    }

    throw error;
  }
}

export async function getProjectSlugs() {
  try {
    const entries = await readdir(projectsDirectory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name.replace(/\.json$/u, ""))
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project> {
  return readProjectFromFile(slug);
}

export async function getAllProjects(): Promise<Project[]> {
  const slugs = await getProjectSlugs();
  const projects = await Promise.all(slugs.map((slug) => readProjectFromFile(slug)));

  return projects
    .filter((project) => !project.isDraft || isDevelopmentMode())
    .sort((left, right) => {
      // Keep the dashboard and /work directory newest-first by default.
      const byDate = getProjectSortValue(right) - getProjectSortValue(left);

      if (byDate !== 0) {
        return byDate;
      }

      return left.title.localeCompare(right.title);
    });
}
