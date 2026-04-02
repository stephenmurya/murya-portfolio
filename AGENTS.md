<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Palmer Clone Project

## What This Is
This repo contains a cleaned-up Next.js 16 project for the Palmer homepage clone, plus a Codex-only website cloning workflow in `.codex/skills/clone-website/SKILL.md`.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript check
- `npm run check` - Run lint + typecheck + build

## Code Style
- TypeScript strict mode, no `any`
- 2-space indentation
- Responsive: mobile-first

## Design Principles
- Match the target's spacing, colors, typography, and layout exactly
- Use real content and extracted assets whenever possible
- Preserve visual fidelity before introducing custom changes

## Project Structure
```
src/
  app/              # Next.js routes and extracted Palmer CSS
  content/          # Extracted Palmer HTML payload
public/
  images/           # Downloaded images from the target site
  fonts/            # Downloaded font files from the target site
docs/
  research/         # Inspection output and specs
  design-references/ # Screenshots and visual references
scripts/            # Codex extraction and asset download scripts
```

## Codex Notes
- Keep `.codex/skills/clone-website/SKILL.md` as the source for the Codex cloning workflow.
- Keep the research and visual references in `docs/` when they are useful for future QA or iteration.

@docs/research/INSPECTION_GUIDE.md
