import { Compass, Search } from "lucide-react";

type EmptyStateProps = {
  activeFilter: string;
  suggestedCategory?: string;
  onClearFilters: () => void;
  onSelectSuggestion?: (category: string) => void;
};

export function EmptyState({
  activeFilter,
  suggestedCategory,
  onClearFilters,
  onSelectSuggestion,
}: EmptyStateProps) {
  const isAllFilter = activeFilter === "All";
  const title = isAllFilter
    ? "No projects are published yet."
    : `No ${activeFilter} projects found yet.`;
  const description = isAllFilter
    ? "Fresh case studies from Stephen Murya's local CMS will appear here as soon as they go live."
    : "Try a broader discipline or reset the directory to discover the rest of the work.";

  return (
    <div className="overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.03]">
      <div className="relative px-6 py-10 sm:px-8 sm:py-12">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-white/[0.03] blur-3xl" />

        <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="absolute inset-3 rounded-full border border-dashed border-white/10" />
            <Compass className="h-8 w-8 text-white/75" strokeWidth={1.5} />
            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900">
              <Search className="h-4 w-4 text-white/65" strokeWidth={1.75} />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">
              Discovery
            </p>
            <h2 className="text-2xl font-medium tracking-[-0.04em] text-white sm:text-3xl">
              {title}
            </h2>
            <p className="text-sm leading-6 text-white/55 sm:text-[15px]">
              {description}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center justify-center rounded-full border border-white bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Clear All Filters
            </button>
            {suggestedCategory && onSelectSuggestion ? (
              <button
                type="button"
                onClick={() => onSelectSuggestion(suggestedCategory)}
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white"
              >
                View all {suggestedCategory} projects instead
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
