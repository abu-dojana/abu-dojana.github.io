# Abu Dojana · A personal notebook

A flexible personal website with a hosted Pages CMS editor, light/dark themes, and a browser-based CV builder. Subjects and navigation are content: adding an adventure, job experience, article, or a new interest does not require new code.

## Run locally

Use Node.js 24 or newer and npm.

```sh
npm ci
npm run dev
```

Open the Local address printed by Astro. Before publishing:

```sh
npm run check
npm test
npm run build
```

## Editing

See [EDITING.md](EDITING.md) for the full browser workflow, setup, privacy details, troubleshooting, and custom-domain connection.

- Dashboard: https://app.pagescms.org/
- Repository: https://github.com/abu-dojana/abu-dojana.github.io
- Live website: https://abu-dojana.github.io/
- CV demo: https://abu-dojana.github.io/cv/build/?demo=1

The initial profile fields are intentionally blank. Example entries are visibly marked, and the default CV does not treat them as your experience. Preview mode keeps the starter out of search engines. Fill in your real public profile, replace examples, and turn preview mode off when ready.

## Structure

- `content/site.json`: profile, homepage copy, navigation, and settings.
- `content/entries/`: Markdown entries with common metadata and optional CV presentation.
- `content/categories/`, `content/pages/`, `content/cv-sections/`: editable subjects, standalone pages, and CV headings.
- `.pages.yml`: forms for the hosted editor.
- `src/lib/content.ts`: validated loading, stable references, and sanitized Markdown.
- `src/lib/cv.ts`: selection, ordering, honest demo handling, and local storage whitelist.
- `.github/workflows/deploy.yml`: checks and publishes successful `master` builds to GitHub Pages.

Private text entered in the CV builder stays in memory. Only CV selections/order and theme preferences are stored on the current browser. This site has no analytics, backend account database, or private cloud CV storage. All repository files and history—including drafts—are public.

## Publishing and recovery

GitHub Pages uses GitHub Actions, with `master` as the publishing branch. A CMS save creates a commit, then checks/tests/build run before deployment. A failed build does not replace the last successful deployment. Set the GitHub repository variable `SITE_URL` when switching to a custom domain.

The previous AcademicPages starter is preserved in the Git tag `legacy-academicpages-2026-10-29`. Do not delete that recovery point. The new site is an Astro build, so restoration also requires restoring the old branch-based Jekyll publishing setting; see the editing guide.
