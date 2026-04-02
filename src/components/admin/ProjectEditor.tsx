"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { CommitModal } from "@/components/admin/CommitModal";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type {
  Block,
  GalleryBlock,
  HeroBlock,
  Project,
} from "@/lib/schema/project";

type ProjectEditorProps = {
  initialProject: Project;
};

type ProjectFormValues = Project;

type BlockFieldProps = {
  index: number;
  control: Control<ProjectFormValues>;
  register: UseFormRegister<ProjectFormValues>;
  setValue: UseFormSetValue<ProjectFormValues>;
  getValues: UseFormGetValues<ProjectFormValues>;
  projectSlug: string;
};

function createDefaultBlock(type: Block["type"]): Block {
  switch (type) {
    case "hero":
      return {
        type: "hero",
        title: "",
        subtitle: "",
        tools: [],
        coverImage: "",
      };
    case "text":
      return {
        type: "text",
        content: "",
      };
    case "side-by-side":
      return {
        type: "side-by-side",
        layout: "image-left",
        image: "",
        text: "",
      };
    case "gallery":
      return {
        type: "gallery",
        images: [],
      };
    default: {
      const exhaustiveCheck: never = type;

      return exhaustiveCheck;
    }
  }
}

function FieldGroup({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="block font-medium text-zinc-200">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function inputClassName() {
  return "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/[0.07]";
}

function textareaClassName() {
  return `${inputClassName()} min-h-28 resize-y`;
}

function panelClassName() {
  return "space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4";
}

function buttonClassName(variant: "primary" | "secondary" | "danger" = "secondary") {
  if (variant === "primary") {
    return "inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60";
  }

  if (variant === "danger") {
    return "inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15";
  }

  return "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]";
}

function UploadImageButton({
  projectSlug,
  onUploaded,
  label,
}: {
  projectSlug: string;
  onUploaded: (url: string) => void;
  label: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <label className={`${buttonClassName()} cursor-pointer`}>
        <span>{isUploading ? "Uploading..." : label}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading || !projectSlug.trim()}
          onChange={async (event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            if (!projectSlug.trim()) {
              setUploadError("Set a project slug before uploading images.");
              event.target.value = "";
              return;
            }

            setIsUploading(true);
            setUploadError(null);

            try {
              const formData = new FormData();
              formData.append("projectSlug", projectSlug);
              formData.append("file", file);

              const response = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
              });
              const payload = (await response.json()) as
                | { url?: string; error?: string }
                | undefined;

              if (!response.ok || !payload?.url) {
                throw new Error(payload?.error || "Failed to upload image.");
              }

              onUploaded(payload.url);
            } catch (error) {
              setUploadError(
                error instanceof Error ? error.message : "Failed to upload image."
              );
            } finally {
              setIsUploading(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      {uploadError ? (
        <p className="text-xs text-red-300">{uploadError}</p>
      ) : null}
      {!projectSlug.trim() ? (
        <p className="text-xs text-zinc-500">
          Add a slug first so uploads know where to save files.
        </p>
      ) : null}
    </div>
  );
}

function HeroBlockFields({
  index,
  control,
  register,
  setValue,
  getValues,
  projectSlug,
}: BlockFieldProps) {
  const tools = useWatch({
    control,
    name: `blocks.${index}.tools` as const,
    defaultValue: [],
  }) as HeroBlock["tools"];

  return (
    <div className={panelClassName()}>
      <FieldGroup label="Title">
        <input
          {...register(`blocks.${index}.title` as const)}
          className={inputClassName()}
          placeholder="Project hero title"
        />
      </FieldGroup>
      <FieldGroup label="Subtitle">
        <textarea
          {...register(`blocks.${index}.subtitle` as const)}
          className={textareaClassName()}
          placeholder="Short summary or positioning statement"
        />
      </FieldGroup>
      <FieldGroup label="Cover Image URL">
        <input
          {...register(`blocks.${index}.coverImage` as const)}
          className={inputClassName()}
          placeholder="/images/projects/slug/cover.jpg"
        />
      </FieldGroup>
      <UploadImageButton
        projectSlug={projectSlug}
        label="Upload Cover Image"
        onUploaded={(url) =>
          setValue(`blocks.${index}.coverImage` as const, url, {
            shouldDirty: true,
          })
        }
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-200">Tools</p>
          <button
            type="button"
            className={buttonClassName()}
            onClick={() => {
              const nextTools = [
                ...((getValues(`blocks.${index}.tools` as const) as string[]) || []),
                "",
              ];
              setValue(`blocks.${index}.tools` as const, nextTools, {
                shouldDirty: true,
              });
            }}
          >
            Add Tool
          </button>
        </div>
        {tools.length > 0 ? (
          <div className="space-y-2">
            {tools.map((tool, toolIndex) => (
              <div key={`${tool}-${toolIndex}`} className="flex gap-2">
                <input
                  {...register(`blocks.${index}.tools.${toolIndex}` as const)}
                  className={inputClassName()}
                  placeholder={`Tool ${toolIndex + 1}`}
                />
                <button
                  type="button"
                  className={buttonClassName("danger")}
                  onClick={() => {
                    const nextTools = tools.filter(
                      (_, currentIndex) => currentIndex !== toolIndex
                    );
                    setValue(`blocks.${index}.tools` as const, nextTools, {
                      shouldDirty: true,
                    });
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Add a few tools to showcase the stack in the preview.
          </p>
        )}
      </div>
    </div>
  );
}

function TextBlockFields({ index, register }: BlockFieldProps) {
  return (
    <div className={panelClassName()}>
      <FieldGroup
        label="Markdown Content"
        hint="Supports headings, emphasis, lists, and inline code in the preview."
      >
        <textarea
          {...register(`blocks.${index}.content` as const)}
          className={`${textareaClassName()} min-h-48`}
          placeholder="Write the narrative for this section in markdown..."
        />
      </FieldGroup>
    </div>
  );
}

function SideBySideBlockFields({
  index,
  register,
  setValue,
  projectSlug,
}: BlockFieldProps) {
  return (
    <div className={panelClassName()}>
      <FieldGroup label="Layout">
        <select
          {...register(`blocks.${index}.layout` as const)}
          className={inputClassName()}
        >
          <option value="image-left">Image Left</option>
          <option value="image-right">Image Right</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Image URL">
        <input
          {...register(`blocks.${index}.image` as const)}
          className={inputClassName()}
          placeholder="/images/projects/slug/detail.jpg"
        />
      </FieldGroup>
      <UploadImageButton
        projectSlug={projectSlug}
        label="Upload Side-by-Side Image"
        onUploaded={(url) =>
          setValue(`blocks.${index}.image` as const, url, {
            shouldDirty: true,
          })
        }
      />
      <FieldGroup label="Markdown Text">
        <textarea
          {...register(`blocks.${index}.text` as const)}
          className={`${textareaClassName()} min-h-40`}
          placeholder="Explain the moment, insight, or design rationale..."
        />
      </FieldGroup>
    </div>
  );
}

function GalleryBlockFields({
  index,
  control,
  register,
  setValue,
  getValues,
  projectSlug,
}: BlockFieldProps) {
  const images = useWatch({
    control,
    name: `blocks.${index}.images` as const,
    defaultValue: [],
  }) as GalleryBlock["images"];

  return (
    <div className={panelClassName()}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-200">Gallery Images</p>
        <button
          type="button"
          className={buttonClassName()}
          onClick={() => {
            const nextImages = [
              ...((getValues(`blocks.${index}.images` as const) as string[]) || []),
              "",
            ];
            setValue(`blocks.${index}.images` as const, nextImages, {
              shouldDirty: true,
            });
          }}
        >
          Add Image Slot
        </button>
      </div>
      <UploadImageButton
        projectSlug={projectSlug}
        label="Upload Gallery Image"
        onUploaded={(url) => {
          const currentImages =
            (getValues(`blocks.${index}.images` as const) as string[]) || [];
          setValue(`blocks.${index}.images` as const, [...currentImages, url], {
            shouldDirty: true,
          });
        }}
      />
      {images.length > 0 ? (
        <div className="space-y-3">
          {images.map((image, imageIndex) => (
            <div key={`${image}-${imageIndex}`} className="flex gap-2">
              <input
                {...register(`blocks.${index}.images.${imageIndex}` as const)}
                className={inputClassName()}
                placeholder={`/images/projects/${projectSlug}/gallery-${imageIndex + 1}.jpg`}
              />
              <button
                type="button"
                className={buttonClassName("danger")}
                onClick={() => {
                  const nextImages = images.filter(
                    (_, currentIndex) => currentIndex !== imageIndex
                  );
                  setValue(`blocks.${index}.images` as const, nextImages, {
                    shouldDirty: true,
                  });
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Upload images or add URLs manually to build the gallery.
        </p>
      )}
    </div>
  );
}

function BlockFields(props: BlockFieldProps & { type: Block["type"] }) {
  switch (props.type) {
    case "hero":
      return <HeroBlockFields {...props} />;
    case "text":
      return <TextBlockFields {...props} />;
    case "side-by-side":
      return <SideBySideBlockFields {...props} />;
    case "gallery":
      return <GalleryBlockFields {...props} />;
    default: {
      const exhaustiveCheck: never = props.type;

      return exhaustiveCheck;
    }
  }
}

export function ProjectEditor({ initialProject }: ProjectEditorProps) {
  const {
    control,
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProjectFormValues>({
    defaultValues: initialProject,
  });
  const {
    fields: blockFields,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: "blocks",
  });
  const liveBlocks = useWatch({
    control,
    name: "blocks",
    defaultValue: initialProject.blocks,
  });
  const liveTitle = useWatch({
    control,
    name: "title",
    defaultValue: initialProject.title || "Untitled",
  });
  const liveDate = useWatch({
    control,
    name: "date",
    defaultValue: initialProject.date,
  });
  const liveCategory = useWatch({
    control,
    name: "category",
    defaultValue: initialProject.category,
  });
  const liveSlug = useWatch({
    control,
    name: "slug",
    defaultValue: initialProject.slug,
  });
  const liveThumbnail = useWatch({
    control,
    name: "thumbnail",
    defaultValue: initialProject.thumbnail,
  });
  const previewBlocks = useMemo(
    () => (liveBlocks as Block[]) || [],
    [liveBlocks]
  );
  const defaultCommitMessage = `Update ${liveTitle || "Untitled"} content`;
  const [saveState, setSaveState] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({
    kind: "idle",
    message: "",
  });
  const [originalSlug, setOriginalSlug] = useState(initialProject.slug);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployErrorMessage, setDeployErrorMessage] = useState("");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-white">
      <div className="grid min-h-0 flex-1 grid-cols-2">
        <form
          className="min-h-0 overflow-y-auto border-r border-white/10"
          onSubmit={handleSubmit(async (values) => {
            setSaveState({ kind: "idle", message: "" });

            try {
              const response = await fetch("/api/admin/projects", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-original-slug": originalSlug,
                },
                body: JSON.stringify(values),
              });
              const payload = (await response.json()) as
                | {
                    error?: string;
                    slug?: string;
                    issues?: Array<{ path?: Array<string | number>; message?: string }>;
                  }
                | undefined;

              if (!response.ok) {
                const issueText = payload?.issues
                  ?.map((issue) => {
                    const issuePath = issue.path?.join(".") || "root";

                    return `${issuePath}: ${issue.message}`;
                  })
                  .join(" | ");

                throw new Error(
                  issueText || payload?.error || "Failed to save project."
                );
              }

              if (payload?.slug) {
                setOriginalSlug(payload.slug);

                if (
                  payload.slug !== originalSlug &&
                  typeof window !== "undefined"
                ) {
                  window.history.replaceState(
                    window.history.state,
                    "",
                    `/admin/projects/${encodeURIComponent(payload.slug)}`
                  );
                }
              }

              setSaveState({ kind: "idle", message: "" });
              setDeployErrorMessage("");
              setIsCommitModalOpen(true);
            } catch (error) {
              setIsCommitModalOpen(false);
              setSaveState({
                kind: "error",
                message:
                  error instanceof Error ? error.message : "Failed to save project.",
              });
            }
          })}
        >
          <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/95 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Project Editor
                </p>
                <h1 className="mt-1 text-xl font-semibold text-white">
                  {liveTitle || "Untitled"}
                </h1>
              </div>
              <button
                type="submit"
                className={buttonClassName("primary")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
            {saveState.message ? (
              <p
                className={`mt-3 text-sm ${
                  saveState.kind === "error" ? "text-red-300" : "text-emerald-300"
                }`}
              >
                {saveState.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-8 p-6">
            <section className={panelClassName()}>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup label="Slug">
                  <input
                    {...register("slug")}
                    className={inputClassName()}
                    placeholder="test-project"
                  />
                </FieldGroup>
                <FieldGroup label="Date">
                  <input
                    {...register("date")}
                    className={inputClassName()}
                    placeholder="2026-04-02"
                  />
                </FieldGroup>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup label="Category">
                  <input
                    {...register("category")}
                    className={inputClassName()}
                    placeholder="Web Development"
                  />
                </FieldGroup>
                <FieldGroup label="Thumbnail URL">
                  <input
                    {...register("thumbnail")}
                    className={inputClassName()}
                    placeholder="/images/projects/slug/thumbnail.jpg"
                  />
                </FieldGroup>
              </div>
              <UploadImageButton
                projectSlug={liveSlug}
                label="Upload Thumbnail"
                onUploaded={(url) =>
                  setValue("thumbnail", url, {
                    shouldDirty: true,
                  })
                }
              />
              <FieldGroup label="Title">
                <input
                  {...register("title")}
                  className={inputClassName()}
                  placeholder="Project title"
                />
              </FieldGroup>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  {...register("isDraft")}
                  className="size-4 rounded border-white/20 bg-transparent"
                />
                <span>Mark this project as draft</span>
              </label>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Content Blocks</h2>
                  <p className="text-sm text-zinc-500">
                    Add, reorder, and edit sections for the live preview.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["hero", "text", "side-by-side", "gallery"] as Block["type"][]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        className={buttonClassName()}
                        onClick={() => append(createDefaultBlock(type))}
                      >
                        Add {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              {blockFields.length > 0 ? (
                <div className="space-y-4">
                  {blockFields.map((field, index) => (
                    <section
                      key={field.id}
                      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                            Block {index + 1}
                          </p>
                          <h3 className="mt-1 text-base font-semibold capitalize text-white">
                            {field.type}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={buttonClassName()}
                            disabled={index === 0}
                            onClick={() => move(index, index - 1)}
                          >
                            Move Up
                          </button>
                          <button
                            type="button"
                            className={buttonClassName()}
                            disabled={index === blockFields.length - 1}
                            onClick={() => move(index, index + 1)}
                          >
                            Move Down
                          </button>
                          <button
                            type="button"
                            className={buttonClassName("danger")}
                            onClick={() => remove(index)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <BlockFields
                        type={field.type}
                        index={index}
                        control={control}
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
                        projectSlug={liveSlug}
                      />
                    </section>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm text-zinc-500">
                  No blocks yet. Add a hero, text, side-by-side, or gallery block to
                  start composing the project page.
                </div>
              )}
            </section>
          </div>
        </form>

        <aside className="min-h-0 overflow-y-auto bg-zinc-900/80">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-8 py-10">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                Live Preview
              </p>
              <h2 className="mt-3 text-4xl font-semibold text-white">
                {liveTitle || "Untitled"}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/55">
                <span>{liveDate || "No date yet"}</span>
                <span>{liveCategory || "No category yet"}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  /work/{liveSlug || "untitled"}
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
                Directory Card Thumbnail
              </p>
              {liveThumbnail?.trim() ? (
                <div className="relative aspect-[672/531] overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.03]">
                  {/* Keep the admin preview aligned with the public /work card image ratio. */}
                  <Image
                    src={liveThumbnail}
                    alt={`${liveTitle || "Project"} thumbnail`}
                    fill
                    sizes="(max-width: 1280px) 100vw, 672px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[672/531] items-center justify-center rounded-[10px] border border-dashed border-white/15 bg-white/[0.03] px-4 text-center text-sm text-white/40">
                  Upload a thumbnail to preview the /work card image.
                </div>
              )}
            </div>
            <BlockRenderer blocks={previewBlocks} />
          </div>
        </aside>
      </div>

      <CommitModal
        key={`${isCommitModalOpen ? "open" : "closed"}-${defaultCommitMessage}`}
        open={isCommitModalOpen}
        defaultMessage={defaultCommitMessage}
        errorMessage={deployErrorMessage}
        isSubmitting={isDeploying}
        onCancel={() => {
          setIsCommitModalOpen(false);
          setDeployErrorMessage("");
          setSaveState({
            kind: "success",
            message: "Project saved locally. Push to deploy when ready.",
          });
        }}
        onSubmit={async (message) => {
          setIsDeploying(true);
          setDeployErrorMessage("");

          try {
            const response = await fetch("/api/admin/deploy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ message }),
            });
            const payload = (await response.json()) as
              | {
                  error?: string;
                  stderr?: string;
                }
              | undefined;

            if (!response.ok) {
              const errorText =
                [payload?.error, payload?.stderr]
                  .filter((value): value is string => Boolean(value))
                  .join(" ")
                  .trim() || "Failed to push changes.";

              throw new Error(errorText);
            }

            setIsCommitModalOpen(false);
            setSaveState({
              kind: "success",
              message: "Changes pushed! Vercel is building.",
            });
          } catch (error) {
            setDeployErrorMessage(
              error instanceof Error ? error.message : "Failed to push changes."
            );
          } finally {
            setIsDeploying(false);
          }
        }}
      />
    </div>
  );
}
