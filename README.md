# Abu Dojana · Personal website

A flexible personal website with a hosted Pages CMS editor, light/dark themes, and a browser CV builder.

The editor is **page-first**: open **Pages → choose or create a page → Items → Add item**. Create any subject page and manage its contents in that form. There is no fixed subject list or page-count limit in the site, and normal pages need no separate category, entry, or menu setup.

## Edit in your browser

- Dashboard: <https://app.pagescms.org/>
- Repository: <https://github.com/abu-dojana/abu-dojana.github.io>
- Website: <https://abu-dojana.github.io/>
- Example CV builder: <https://abu-dojana.github.io/cv/build/?demo=1>

Use the website's **Log in** link to open the Pages CMS owner dashboard, sign in with the repository owner's existing GitHub account, and select **main**. The sidebar exposes Pages, Profile & website settings, CV sections, and images. Visitors do not need an account or signup. See [EDITING.md](EDITING.md) for the complete editing guide, publishing checks, and recovery.

Pages share a reader with a left-hand item list and a central detail area. The top navigation opens each page's overview; selecting a child item opens its details in that same reader. Additional top-level links appear under **More** when needed. Publishing, menu visibility, labels, and order are editable. Items live inside their parent page and can be as simple as a skill title or as detailed as a project write-up. Optional CV presentation is edited on that same item.

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
- `src/lib/content.ts`: validated loading, flattened page items, inherited publication/example flags, stable IDs, and sanitized Markdown.
- `src/lib/cv.ts`: CV selection/order and the browser-storage whitelist.
- `.github/workflows/deploy.yml`: checks and publishes successful `main` builds.

Unpublished pages take their items out of public routes, navigation, and the CV builder. Deleting a whole page removes its children as well, without affecting other pages or requiring a settings/code cleanup; stale optional page-menu overrides are ignored. Empty pages and new subjects work without a schema change. Items also have their own publishing switch. A page's title does not determine its items' CV sections. Existing `/entries/<slug>/` links remain stable and open in the owning page's reader.

Private CV text stays in memory. Only selection/order and theme preferences are stored in that browser. Repository files and history—including drafts—are public. There is no private cloud CV storage or automatic PDF-download service; export uses browser printing.

## Publishing and recovery

GitHub Pages uses GitHub Actions with **main** as the publishing branch. A dashboard save creates a commit, then validation, tests, and build run before deployment. A failed run leaves the last successful site available. A dashboard save and a live deployment must each be verified; configuration alone does not prove the connection works.

For a custom domain, configure GitHub Pages/DNS and set the repository Actions variable **SITE_URL** before rebuilding.

The AcademicPages starter is preserved by **legacy-academicpages-2026-10-29**. Keep that recovery tag and the repository history. Restoring it also requires its former branch-based Jekyll publishing setting; see the editing guide.
