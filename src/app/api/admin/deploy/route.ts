import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  CommitMessageSchema,
  createDevelopmentOnlyForbiddenResponse,
  isDevelopmentEnvironment,
  sanitizeCommitMessage,
} from "@/lib/cms/admin";

const execAsync = promisify(exec);

type ExecError = Error & {
  code?: number;
  stdout?: string;
  stderr?: string;
};

export const runtime = "nodejs";

function formatGitOutput(error: ExecError) {
  return [error.stderr, error.stdout, error.message]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n")
    .trim();
}

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

  const parsedPayload = CommitMessageSchema.safeParse(
    payload && typeof payload === "object" && "message" in payload
      ? payload.message
      : undefined
  );

  if (!parsedPayload.success) {
    return Response.json(
      {
        error: "Commit message validation failed.",
        issues: parsedPayload.error.issues,
      },
      { status: 400 }
    );
  }

  let safeMessage: string;

  try {
    safeMessage = sanitizeCommitMessage(parsedPayload.data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Commit message sanitization failed.",
      },
      { status: 400 }
    );
  }

  const command =
    `git add src/content/projects public/images && ` +
    `git commit -m "${safeMessage}" && ` +
    `git push origin main`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });

    return Response.json({
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (error) {
    const execError = error as ExecError;
    const output = formatGitOutput(execError);

    if (/nothing (added )?to commit|working tree clean/iu.test(output)) {
      return Response.json(
        {
          error: "No changes detected to push.",
          stderr: output,
        },
        { status: 400 }
      );
    }

    if (/rejected|failed to push some refs|non-fast-forward/iu.test(output)) {
      return Response.json(
        {
          error: "Git push was rejected.",
          stderr: output,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: "Git deploy failed.",
        stderr: output,
      },
      { status: 500 }
    );
  }
}
