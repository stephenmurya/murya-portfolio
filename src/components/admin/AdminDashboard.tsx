"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import {
  BarChart3,
  ExternalLink,
  FilePlus2,
  PencilLine,
  Search,
  Trash2,
} from "lucide-react";
import { SafeDeleteModal } from "@/components/admin/SafeDeleteModal";
import type { Project } from "@/lib/schema/project";

type AdminDashboardProps = {
  initialProjects: Project[];
  analyticsUrl: string;
};

function formatProjectDate(value: string) {
  const parsedDate = Date.parse(value);

  if (Number.isNaN(parsedDate)) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

export function AdminDashboard({
  initialProjects,
  analyticsUrl,
}: AdminDashboardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All categories");
  const [actionMessage, setActionMessage] = useState<{
    kind: "idle" | "success" | "error" | "pending";
    text: string;
  }>({
    kind: "idle",
    text: "",
  });
  const [pendingStatusSlug, setPendingStatusSlug] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((project) => project.category.trim())
            .filter((category) => category.length > 0)
        )
      ).sort((left, right) => left.localeCompare(right)),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesCategory =
        activeCategory === "All categories" ||
        project.category.trim() === activeCategory;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearchQuery, projects]);

  const liveCount = projects.filter((project) => !project.isDraft).length;
  const draftCount = projects.length - liveCount;

  async function handleToggleDraft(project: Project) {
    const nextDraftState = !project.isDraft;

    setPendingStatusSlug(project.slug);
    setActionMessage({ kind: "idle", text: "" });

    try {
      const response = await fetch(`/api/admin/projects/${project.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDraft: nextDraftState }),
      });
      const payload = (await response.json()) as
        | { error?: string; project?: Project }
        | undefined;

      if (!response.ok || !payload?.project) {
        throw new Error(payload?.error || "Failed to update project status.");
      }

      setProjects((currentProjects) =>
        currentProjects.map((currentProject) =>
          currentProject.slug === payload.project?.slug
            ? payload.project
            : currentProject
        )
      );
      setActionMessage({
        kind: "success",
        text: `${payload.project.title} is now ${
          payload.project.isDraft ? "saved as draft" : "live"
        }.`,
      });
    } catch (error) {
      setActionMessage({
        kind: "error",
        text:
          error instanceof Error ? error.message : "Failed to update project status.",
      });
    } finally {
      setPendingStatusSlug(null);
    }
  }

  async function handleDeleteProject() {
    if (!deleteTarget) {
      return;
    }

    const projectToDelete = deleteTarget;
    const previousProjects = projects;

    setIsDeleting(true);
    setDeleteError("");
    setDeleteTarget(null);
    setProjects((currentProjects) =>
      currentProjects.filter(
        (currentProject) => currentProject.slug !== projectToDelete.slug
      )
    );
    setActionMessage({
      kind: "pending",
      text: `Deleting ${projectToDelete.title}...`,
    });

    try {
      const response = await fetch(`/api/admin/projects/${projectToDelete.slug}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as
        | { error?: string; slug?: string }
        | undefined;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete project.");
      }

      setActionMessage({
        kind: "success",
        text: `${projectToDelete.title} was deleted from the local CMS.`,
      });
    } catch (error) {
      setProjects(previousProjects);
      setActionMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Failed to delete project.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
          <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Admin Dashboard
              </p>
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  Project Management
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  Manage Stephen Murya&apos;s local JSON portfolio, track draft
                  status, and jump straight into editing or review.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/analytics"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Website Analytics</span>
              </Link>
              <Link
                href={analyticsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Analytics</span>
              </Link>
              <Link
                href="/admin/projects/new"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>Add New Project</span>
              </Link>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Total Projects
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{projects.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Live
              </p>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">
                {liveCount}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Drafts
              </p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">
                {draftCount}
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-black/30 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search projects by title..."
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] px-11 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25"
                />
              </div>

              <select
                value={activeCategory}
                onChange={(event) =>
                  startTransition(() => {
                    setActiveCategory(event.target.value);
                  })
                }
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              >
                <option value="All categories">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-b border-white/10 pb-4 text-xs uppercase tracking-[0.24em] text-zinc-500">
              <span>{filteredProjects.length} matching projects</span>
              <span>Draft status updates save instantly</span>
            </div>

            {actionMessage.text ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  actionMessage.kind === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : actionMessage.kind === "pending"
                      ? "border-white/10 bg-white/[0.03] text-zinc-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {actionMessage.text}
              </div>
            ) : null}

            {filteredProjects.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
                <div className="hidden grid-cols-[96px_minmax(0,1.5fr)_minmax(0,1fr)_120px_120px_220px] gap-4 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.24em] text-zinc-500 lg:grid">
                  <span>Thumbnail</span>
                  <span>Title</span>
                  <span>Category</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                <div className="divide-y divide-white/10">
                  {filteredProjects.map((project) => {
                    const isPendingStatus = pendingStatusSlug === project.slug;

                    return (
                      <article
                        key={project.slug}
                        className="grid gap-4 px-5 py-5 lg:grid-cols-[96px_minmax(0,1.5fr)_minmax(0,1fr)_120px_120px_220px] lg:items-center"
                      >
                        <div className="relative h-24 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                          <Image
                            src={project.thumbnail}
                            alt={project.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-lg font-medium text-white">
                            {project.title}
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            /work/{project.slug}
                          </p>
                        </div>

                        <p className="text-sm text-zinc-300">{project.category}</p>
                        <p className="text-sm text-zinc-400">
                          {formatProjectDate(project.date)}
                        </p>

                        <div>
                          <button
                            type="button"
                            disabled={isPendingStatus}
                            onClick={() => void handleToggleDraft(project)}
                            className={`inline-flex min-w-[88px] items-center justify-center rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              project.isDraft
                                ? "border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                            }`}
                          >
                            {isPendingStatus
                              ? "Saving"
                              : project.isDraft
                                ? "Draft"
                                : "Live"}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/projects/${project.slug}`}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                          >
                            <PencilLine className="h-4 w-4" />
                            <span>Edit</span>
                          </Link>
                          <Link
                            href={`/work/${project.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>View</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setDeleteTarget(project);
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/15"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                  No matches
                </p>
                <h2 className="mt-4 text-2xl font-medium text-white">
                  No projects match this search.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
                  Clear the search query or switch the category filter to bring the
                  full project list back into view.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <SafeDeleteModal
        key={deleteTarget?.slug ?? "closed"}
        open={Boolean(deleteTarget)}
        projectTitle={deleteTarget?.title ?? ""}
        isSubmitting={isDeleting}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError("");
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteProject}
      />
    </>
  );
}
