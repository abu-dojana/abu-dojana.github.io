# Abu Dojana · A personal notebook

A flexible personal website with a hosted Pages CMS editor, light/dark themes, and a browser CV builder.

The editor is **page-first**: open **Pages → Projects → Items → Add item**. Create any page—Experience, Skills, Hobbies, Adventures, Blog, or another subject—and manage its contents in that form. Normal pages need no separate category, entry, or menu setup.

## Edit in your browser

- Dashboard: <https://app.pagescms.org/>
- Repository: <https://github.com/abu-dojana/abu-dojana.github.io>
- Website: <https://abu-dojana.github.io/>
- Example CV builder: <https://abu-dojana.github.io/cv/build/?demo=1>

Sign in with GitHub, authorize Pages CMS for this repository if needed, and select **main**. The sidebar exposes Pages, Profile & website settings, CV sections, and images. See [EDITING.md](EDITING.md) for the complete guide, authorization steps, publishing checks, and recovery.

Pages offer **Cards**, **List**, **Timeline**, and **Article** layouts. Publishing, menu visibility, labels, and order are editable. Items live inside their parent page and can be as simple as a skill title or as detailed as a project write-up. Optional CV presentation is edited on that same item.

The initial real profile is blank. Samples remain labeled and excluded from the real default CV. Preview mode asks search engines not to index the starter. Enter real public information, replace examples, and turn preview mode off when ready.

## Run locally

Use Node.js 24 or newer and npm:

```sh
npm ci
npm run dev
```

Open Astro's printed Local address. Before publishing:

```sh
npm run check
npm test
npm run build
```

## Content structure

- `content/pages/`: Markdown pages containing metadata, an optional introduction, and nested items. This is the primary subject collection.
- `content/site.json`: public profile, homepage copy, preview mode, and optional extra navigation.
- `content/cv-sections/`: editable CV headings and default ordering.
- `.pages.yml`: hosted-editor forms, including collapsed item editors inside Pages.
- `src/lib/content.ts`: validated loading, flattened published items, stable IDs, and sanitized Markdown.
- `src/lib/cv.ts`: CV selection/order and the browser-storage whitelist.
- `.github/workflows/deploy.yml`: checks and publishes successful `main` builds.

Unpublished or removed pages take their items out of public listings and the CV builder. Items also have their own publishing switch. A page's title and layout do not determine its items' CV sections.

Private CV text stays in memory. Only selection/order and theme preferences are stored in that browser. Repository files and history—including drafts—are public. There is no private cloud CV storage or automatic PDF-download service; export uses browser printing.

## Publishing and recovery

GitHub Pages uses GitHub Actions with **main** as the publishing branch. A dashboard save creates a commit, then validation, tests, and build run before deployment. A failed run leaves the last successful site available. A dashboard save and a live deployment must each be verified; configuration alone does not prove the connection works.

For a custom domain, configure GitHub Pages/DNS and set the repository Actions variable **SITE_URL** before rebuilding.

The AcademicPages starter is preserved by **legacy-academicpages-2026-10-29**. Keep that recovery tag and the repository history. Restoring it also requires its former branch-based Jekyll publishing setting; see the editing guide.
