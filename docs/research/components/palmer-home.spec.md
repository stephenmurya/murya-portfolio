# PalmerHome Specification

## Overview
- Target file: `src/app/page.tsx`
- Markup source: `src/content/palmer-home.html`
- Style source: `src/app/palmer.css`
- Reference screenshots:
  - `docs/design-references/palmer-template.framer.website/desktop-full.png`
  - `docs/design-references/palmer-template.framer.website/mobile-full.png`
- Interaction model: mixed static, fixed, sticky, and hover-driven behavior

## Foundation
- Font families extracted from the source:
  - `Inter`
  - `Inter Display`
- Primary palette:
  - background: `#000000`
  - foreground: `#ffffff`
  - muted: `#999999`
  - border / line accents: translucent white / gray

## Asset handling
- Download script: `scripts/download-assets.mjs`
- Extractor script: `scripts/extract-site.mjs`
- Downloaded asset manifest:
  - `docs/research/palmer-template.framer.website/asset-manifest.json`

## Implementation approach
- The page is rendered from the extracted Framer DOM as a static HTML payload.
- Framer CSS was consolidated into `src/app/palmer.css`.
- Remote Framer asset URLs were rewritten to downloaded local `public/` paths.
- Metadata, favicon, and social preview image were mapped in `src/app/layout.tsx`.
