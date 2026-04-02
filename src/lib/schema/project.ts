import { z } from "zod";

export const HeroBlockSchema = z.object({
  type: z.literal("hero"),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  tools: z.array(z.string().min(1)),
  coverImage: z.string().min(1),
});

export const TextBlockSchema = z.object({
  type: z.literal("text"),
  content: z.string().min(1),
});

export const SideBySideBlockSchema = z.object({
  type: z.literal("side-by-side"),
  layout: z.enum(["image-left", "image-right"]),
  image: z.string().min(1),
  text: z.string().min(1),
});

export const GalleryBlockSchema = z.object({
  type: z.literal("gallery"),
  images: z.array(z.string().min(1)),
});

export const BlockSchema = z.discriminatedUnion("type", [
  HeroBlockSchema,
  TextBlockSchema,
  SideBySideBlockSchema,
  GalleryBlockSchema,
]);

export const ProjectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.string().min(1),
  category: z.string().min(1),
  thumbnail: z.string().min(1),
  isDraft: z.boolean(),
  blocks: z.array(BlockSchema),
});

export type HeroBlock = z.infer<typeof HeroBlockSchema>;
export type TextBlock = z.infer<typeof TextBlockSchema>;
export type SideBySideBlock = z.infer<typeof SideBySideBlockSchema>;
export type GalleryBlock = z.infer<typeof GalleryBlockSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type Project = z.infer<typeof ProjectSchema>;
