import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type {
  Block,
  GalleryBlock,
  HeroBlock,
  SideBySideBlock,
  TextBlock,
} from "@/lib/schema/project";

type BlockRendererProps = {
  blocks: Block[];
};

function Placeholder({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/40 ${className}`}
    >
      {children}
    </div>
  );
}

function MarkdownContent({
  content,
  placeholder,
}: {
  content: string;
  placeholder: string;
}) {
  if (!content.trim()) {
    return <Placeholder>{placeholder}</Placeholder>;
  }

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 text-3xl font-semibold text-white last:mb-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 text-2xl font-semibold text-white last:mb-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 text-xl font-semibold text-white last:mb-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-7 text-white/75 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 list-disc space-y-2 pl-5 text-white/75 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 list-decimal space-y-2 pl-5 text-white/75 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-white/80">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-2 border-white/20 pl-4 italic text-white/60 last:mb-0">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white">
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function ImageFrame({
  src,
  alt,
  placeholder,
  aspectClassName,
}: {
  src: string;
  alt: string;
  placeholder: string;
  aspectClassName: string;
}) {
  if (!src.trim()) {
    return <Placeholder className={aspectClassName}>{placeholder}</Placeholder>;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${aspectClassName}`}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="50vw" />
    </div>
  );
}

function HeroBlockView({ data }: { data: HeroBlock }) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Hero</p>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          {data.title.trim() || (
            <span className="text-white/35">Untitled hero section</span>
          )}
        </h2>
        <p className="max-w-2xl text-white/70">
          {data.subtitle.trim() || (
            <span className="text-white/35">Add a subtitle to describe the project.</span>
          )}
        </p>
      </div>
      <ImageFrame
        src={data.coverImage}
        alt={data.title || "Project cover image"}
        placeholder="Upload a cover image to preview it here."
        aspectClassName="min-h-64"
      />
      {data.tools.length > 0 ? (
        <ul className="flex flex-wrap gap-2 text-sm text-white/80">
          {data.tools.map((tool, index) => (
            <li
              key={`${tool}-${index}`}
              className="rounded-full border border-white/15 px-3 py-1"
            >
              {tool.trim() || `Tool ${index + 1}`}
            </li>
          ))}
        </ul>
      ) : (
        <Placeholder className="min-h-16">
          Add tools to show the project stack.
        </Placeholder>
      )}
    </section>
  );
}

function TextBlockView({ data }: { data: TextBlock }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
      <div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">
        Text
      </div>
      <div className="min-h-32">
        <MarkdownContent
          content={data.content}
          placeholder="Start typing markdown to preview formatted text."
        />
      </div>
    </section>
  );
}

function SideBySideBlockView({ data }: { data: SideBySideBlock }) {
  const imageFirst = data.layout !== "image-right";

  return (
    <section className="grid gap-6 rounded-3xl border border-white/10 bg-black/30 p-6 md:grid-cols-2">
      <div className={imageFirst ? undefined : "md:order-2"}>
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">
          Side by side
        </p>
        <ImageFrame
          src={data.image}
          alt="Side by side block"
          placeholder="Upload an image for this section."
          aspectClassName="min-h-56"
        />
      </div>
      <div className={imageFirst ? undefined : "md:order-1"}>
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-white/40">
          Layout: {data.layout}
        </p>
        <div className="min-h-56">
          <MarkdownContent
            content={data.text}
            placeholder="Add supporting markdown content for this section."
          />
        </div>
      </div>
    </section>
  );
}

function GalleryBlockView({ data }: { data: GalleryBlock }) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gallery</p>
      {data.images.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              {image.trim() ? (
                <Image
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 50vw, 33vw"
                />
              ) : (
                <Placeholder className="aspect-[4/3] rounded-none border-0">
                  Add an image URL for gallery slot {index + 1}.
                </Placeholder>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Placeholder className="min-h-40">
          Add gallery images to preview the image grid.
        </Placeholder>
      )}
    </section>
  );
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (blocks.length === 0) {
    return (
      <Placeholder className="min-h-64 rounded-3xl">
        Add a content block to start building this project page.
      </Placeholder>
    );
  }

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "hero":
            return <HeroBlockView key={`${block.type}-${index}`} data={block} />;
          case "text":
            return <TextBlockView key={`${block.type}-${index}`} data={block} />;
          case "side-by-side":
            return (
              <SideBySideBlockView
                key={`${block.type}-${index}`}
                data={block}
              />
            );
          case "gallery":
            return <GalleryBlockView key={`${block.type}-${index}`} data={block} />;
          default: {
            const exhaustiveCheck: never = block;

            return exhaustiveCheck;
          }
        }
      })}
    </div>
  );
}
