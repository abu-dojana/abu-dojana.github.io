# Abu Dojana — Portfolio

Personal portfolio, project showcase, and ATS-friendly CV built with Astro and managed via Pages CMS.

- Website: <https://abu-dojana.github.io/>
- CMS Dashboard: <https://app.pagescms.org/>
- Editing Guide: [EDITING.md](EDITING.md)

## Local development

Requires Node.js 24 or newer:

```sh
npm ci
npm run dev
```

Before committing or deploying:

```sh
npm run check
npm test
npm run build
```

## Content structure

- `.pages.yml` — Pages CMS collections and form schema.
- `content/site.json` — public profile, contact links, skill groups, homepage copy, and SEO visibility.
- `content/about.md` — About section content.
- `content/sections/` — navigation sections and their types (`projects`, `experience`, `education`, `skills`, or custom `general`).
- `content/projects/` — individual project files with multi-image galleries, tech stack, links, and highlights.
- `content/experience/` — work and role history.
- `content/education/` — degrees and academic background.
- `content/items/` — entries belonging to custom `general` sections.
- `public/images/` — uploaded media assets.

## Architecture & deployment

- `src/lib/content.ts` — Zod-validated content loader, Markdown sanitizer, and navigation builder.
- `src/lib/cv.ts` — deterministic, single-column ATS CV model built from portfolio entries.
- `.github/workflows/deploy.yml` — runs `npm run check`, `npm test`, `npm run build`, and deploys `dist/` to GitHub Pages on `main`.
- Legacy AcademicPages starter history is preserved under tag `legacy-academicpages-2026-10-29`.
