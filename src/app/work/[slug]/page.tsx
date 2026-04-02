import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getProjectBySlug, getProjectSlugs } from "@/lib/cms/api";

type WorkProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();

  return slugs.map((slug) => ({ slug }));
}

export default async function WorkProjectPage({
  params,
}: WorkProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (project.isDraft && process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16 text-white md:px-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Case study
        </p>
        <h1 className="text-4xl font-semibold md:text-5xl">{project.title}</h1>
        <p className="text-sm text-white/60">{project.date}</p>
      </header>
      <BlockRenderer blocks={project.blocks} />
    </main>
  );
}
