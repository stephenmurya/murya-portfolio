import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/schema/project";

type ProjectCardProps = {
  project: Project;
  index: number;
};

export function ProjectCard({ project, index }: ProjectCardProps) {
  const itemNumber = `(${String(index + 1).padStart(2, "0")})`;
  const categoryLabel = project.category.trim();

  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block text-white no-underline"
      aria-label={`Open ${project.title}`}
    >
      <article className="space-y-3.5">
        <div className="relative aspect-[672/531] overflow-hidden rounded-[10px] bg-zinc-900 ring-1 ring-white/10">
          {project.thumbnail.trim() ? (
            <>
              <Image
                src={project.thumbnail}
                alt={project.title}
                fill
                sizes="(max-width: 1024px) 100vw, 672px"
                className="object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-950 px-6 text-center text-sm uppercase tracking-[0.22em] text-white/35">
              Thumbnail coming soon
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-[19px] font-medium leading-[1.33] text-white transition duration-300 group-hover:text-white/80">
              {project.title}
            </h2>
            <p className="text-[11px] uppercase tracking-[0.26em] text-white/45">
              {categoryLabel}
            </p>
          </div>

          <span className="shrink-0 pt-0.5 text-[13px] font-medium text-white/40">
            {itemNumber}
          </span>
        </div>
      </article>
    </Link>
  );
}
