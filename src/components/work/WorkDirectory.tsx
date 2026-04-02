"use client";

import { startTransition, useMemo, useState } from "react";
import { EmptyState } from "@/components/work/EmptyState";
import { ProjectCard } from "@/components/work/ProjectCard";
import type { Project } from "@/lib/schema/project";

type WorkDirectoryProps = {
  projects: Project[];
};

const defaultDisciplineFilters = [
  "Product Design",
  "Web Development",
  "Brand Strategy",
  "Game Development",
  "Video Production",
];

export function WorkDirectory({ projects }: WorkDirectoryProps) {
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
  const filterOptions = useMemo(
    () =>
      Array.from(new Set(["All", ...defaultDisciplineFilters, ...categories])),
    [categories]
  );
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const visibleProjects = useMemo(
    () =>
      activeCategory === "All"
        ? projects
        : projects.filter(
            (project) => project.category.trim() === activeCategory
          ),
    [activeCategory, projects]
  );
  const suggestedCategory = useMemo(() => {
    const categoryCounts = categories
      .map((category) => ({
        category,
        count: projects.filter((project) => project.category.trim() === category)
          .length,
      }))
      .filter(({ category, count }) => count > 0 && category !== activeCategory)
      .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));

    return categoryCounts[0]?.category;
  }, [activeCategory, categories, projects]);

  return (
    <main id="top" className="min-h-screen bg-black text-white">
      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-12 px-6 pb-16 pt-10 lg:flex-row lg:items-start lg:justify-center lg:gap-[50px]">
        <aside className="w-full lg:sticky lg:top-[130px] lg:max-w-[620px] lg:flex-1">
          <div className="space-y-8 lg:max-w-[430px]">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                Stephen Murya
              </p>
              <div className="flex items-start gap-3">
                <h1 className="text-[clamp(3.75rem,11vw,6.5rem)] font-medium leading-[0.88] tracking-[-0.08em] text-white">
                  <span className="block">All</span>
                  <span className="block">Works</span>
                </h1>
                <span className="pt-3 text-[clamp(1.5rem,3.5vw,3.0625rem)] font-medium leading-none tracking-[-0.04em] text-white/80">
                  ({visibleProjects.length})
                </span>
              </div>
              <p className="max-w-sm text-sm leading-6 text-white/55">
                A live index of project case studies sourced directly from the local
                JSON CMS.
              </p>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                Filter by discipline
              </p>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((category) => {
                  const isActive = activeCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        startTransition(() => {
                          setActiveCategory(category);
                        })
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border-white bg-white text-black"
                          : "border-white/12 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <div className="w-full lg:max-w-[696px] lg:flex-none lg:pl-6">
          {visibleProjects.length > 0 ? (
            <div className="space-y-5">
              {visibleProjects.map((project, index) => (
                <ProjectCard key={project.slug} project={project} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState
              activeFilter={activeCategory}
              suggestedCategory={suggestedCategory}
              onClearFilters={() => {
                startTransition(() => {
                  setActiveCategory("All");
                });
              }}
              onSelectSuggestion={(category) => {
                startTransition(() => {
                  setActiveCategory(category);
                });
              }}
            />
          )}
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-6 text-[11px] uppercase tracking-[0.24em] text-white/35">
          <span>Local CMS powered work index</span>
          <a
            href="#top"
            className="rounded-full border border-white/12 px-4 py-2 text-white/65 transition hover:border-white/30 hover:text-white"
          >
            Back to top
          </a>
        </div>
      </footer>
    </main>
  );
}
