# Product Requirements Document

## 1. Project Identity

### Product Name
Stephen Murya Portfolio

### Primary Purpose
This project is Stephen Murya's public-facing portfolio website and internal authoring system. It exists to showcase multidisciplinary work across:

- Product Design
- Web Development
- Video Editing
- Game Development

### Product Positioning
The website is both:

- A polished public portfolio for recruiters, collaborators, founders, and clients
- A locally operated content system that allows Stephen to manage case studies without relying on a SaaS CMS or external database

### Key Experience Goals

- Present Stephen Murya as a multidimensional product engineer and creative technologist
- Make it easy to publish, update, preview, and remove project case studies
- Keep the public experience fast, static where possible, and deployment-friendly
- Preserve full ownership of content through Git, local files, and Vercel deployments

## 2. Tech Stack

### Core Stack

- Next.js with the App Router
- TypeScript in strict mode
- Tailwind CSS
- Zod
- React Hook Form

### Additional Supporting Tooling

- React Markdown for markdown-capable content blocks
- Recharts for the native admin analytics visualization
- Node.js file-system APIs for local CMS persistence

### Deployment Platform

- Hosted on Vercel

### Operational Model

- Local development is the only environment where admin mutations are allowed
- Production is intended to be a static or server-rendered public portfolio only
- Git pushes are the deployment trigger

## 3. Core Architecture (The GitCMS)

### Architectural Model
This project is a Git-backed headless CMS. It does not use an external database.

### Source of Truth
The source of truth for project content is localized JSON files stored in:

`src/content/projects/`

Each project is represented as a single JSON document that is parsed, validated, edited, and rendered by the application.

### Content Lifecycle

1. A project is created or edited locally through the `/admin` interface
2. The admin UI writes JSON files directly into `src/content/projects/`
3. Uploaded project images are written to `public/images/projects/[slug]/`
4. The project can be previewed immediately through local routes
5. The admin UI can trigger Git add, commit, and push
6. Vercel deployment is triggered by the resulting Git push

### Why This Architecture Exists

- Full ownership of content
- Zero database maintenance
- Git history doubles as content history
- Easy rollback via source control
- Predictable local development workflow
- Strong alignment with Vercel-hosted static and App Router delivery

## 4. Data Model

### Project-Level Document Shape
Each project document currently includes core metadata such as:

- `slug`
- `title`
- `date`
- `category`
- `thumbnail`
- `isDraft`
- `blocks`

### Modular Block System
The case-study system is block-driven. Public `/work/[slug]` pages are rendered by mapping the `blocks` array through a shared React block renderer.

### Current Core Blocks

- Hero
- Text / Rich Text
- Side-by-Side
- Gallery

### Block Intent

- `hero`: top-level framing, title, subtitle, tools, cover image
- `text`: markdown-capable narrative content
- `side-by-side`: paired visual and explanatory content
- `gallery`: multi-image showcase sections

### Validation Boundary
Zod is the strict boundary for schema validation.

That means:

- All project JSON reads must pass through Zod parsing before use
- Invalid JSON or invalid schema should fail loudly in development/build flows
- Admin writes are validated before files are saved
- Public rendering consumes typed, validated data instead of trusting raw JSON

### Rendering Model

- `/work` consumes validated project metadata for directory cards and filtering
- `/work/[slug]` renders project blocks dynamically
- The same block renderer is reused between preview surfaces and public pages to reduce drift

## 5. Security & Boundaries

### Non-Negotiable Rule
All admin functionality is development-only and must be gated by:

`process.env.NODE_ENV === 'development'`

### Protected Surface Area
The following must never be accessible in the production Vercel environment:

- `/admin`
- `/admin/projects/[slug]`
- `/admin/projects/new`
- `/admin/analytics`
- All `/api/admin/*` routes

### Why This Boundary Matters
The admin system performs local and potentially dangerous operations, including:

- Writing project JSON files to disk
- Renaming project files when slugs change
- Uploading images into `public/`
- Deleting project files and image folders
- Executing Git commands for add, commit, and push
- Proxying analytics requests with secure bearer tokens

If these routes were accessible in production, they would create serious risk, including unauthorized writes and remote code execution style attack surfaces.

### Security Expectations

- Production should return `404` or `403` for admin routes and APIs
- Secrets such as analytics tokens must only be read server-side
- The browser must never receive raw bearer tokens
- File operations must sanitize slugs, filenames, and resolved paths

## 6. Legacy Code Handling

### Homepage Reality
The home page currently relies on a sanitized, pre-processed Framer HTML export rather than a fully semantic React rebuild.

### Current Approach

- The raw Framer export lives as HTML content
- A Node.js sanitization script scrubs it before dev/build flows
- Third-party attribution and unsafe links are stripped or normalized
- SEO and metadata are handled natively in Next.js, not by the Framer export

### Constraints

- The Framer export still contains generated class structures and legacy layout complexity
- It is high-fidelity but not ideal for long-term maintainability
- The site currently treats this area as a controlled legacy surface

### Future Direction
Future refactors should progressively replace the sanitized Framer homepage blob with semantic Next.js components, but current operations intentionally keep the sanitization script in place as the compatibility bridge.

## 7. Public Product Surfaces

### Homepage

- Visual landing page derived from sanitized Framer export
- SEO handled natively in Next.js
- Smooth scrolling and link sanitization applied locally

### Work Directory

- Route: `/work`
- Data source: local JSON files
- Displays category-filterable project cards
- Includes empty-state handling when no projects match the active filter

### Project Detail Pages

- Route: `/work/[slug]`
- Rendered from validated block-based JSON content
- Draft projects are hidden outside development

## 8. Admin Product Surfaces

### Project Dashboard

- Route: `/admin`
- Searchable and filterable project management table
- Supports create, edit, view, delete, and draft toggle actions

### Project Editor

- Split-pane authoring experience
- Left side: form editing
- Right side: live preview using shared block rendering

### Git Deployment Flow

- Save content locally first
- Open commit modal
- Push Git changes directly from the admin UI
- Trigger Vercel builds from Git pushes

### Analytics

- Native admin analytics route uses a secure backend proxy
- Browser calls only the local admin API
- Provider token stays on the server
- Intended for development-only diagnostics and launch monitoring

## 9. Launch Principles

### Product Priorities

- Preserve authoring speed without sacrificing safety
- Keep public output stable, performant, and SEO-clean
- Avoid introducing database complexity prematurely
- Use Git and Vercel as the operational backbone

### Production Readiness Definition
The portfolio should be considered launch-ready when:

- Public pages are responsive and stable
- JSON content can be safely authored end-to-end
- Git push flow is reliable
- Admin remains fully blocked in production
- SEO, previews, contact handling, and analytics are verified
