# Palmer Portfolio Clone

This repo is a cleaned-up Next.js 16 project containing the cloned Palmer homepage and the Codex workflow used to extract it.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run check
```

## Project Layout

```text
src/
  app/        # Next.js routes and extracted Palmer CSS
  content/    # Extracted Palmer HTML payload
public/
  images/     # Downloaded Palmer imagery
  fonts/      # Downloaded Palmer font files
docs/
  research/   # Inspection notes, specs, and asset manifest
  design-references/ # Full-page screenshots and section crops
scripts/
  extract-site.mjs
  download-assets.mjs
.codex/
  skills/clone-website/SKILL.md
```

## Notes

- The live homepage is rendered from `src/content/palmer-home.html`.
- The extracted Framer CSS lives in `src/app/palmer.css`.
- Codex-specific cloning instructions live in `.codex/skills/clone-website/SKILL.md`.
