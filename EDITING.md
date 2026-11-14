# Editing your portfolio through Pages CMS

- Website: <https://abu-dojana.github.io/>
- Dashboard: <https://app.pagescms.org/>
- Repository: <https://github.com/abu-dojana/abu-dojana.github.io>

## 1. Open the dashboard

1. Open <https://app.pagescms.org/> and sign in with the GitHub account that owns `abu-dojana/abu-dojana.github.io`.
2. Select the repository and choose the **main** branch.
3. The sidebar lists:
   - **Projects** — each project is its own file with a multi-image gallery.
   - **Experience** — roles, internships, and work history.
   - **Education** — degrees, institutions, and coursework.
   - **Custom section items** — entries for any custom section you create (Blog, Research, Anime, Awards, etc.).
   - **Sections & Menu Tabs** — create, reorder, show/hide, or delete menu sections.
   - **About** — your personal introduction page.
   - **Profile & website settings** — name, headline, bio, contact links, skills, and homepage copy.
   - **Images** — uploaded photos/screenshots stored in `public/images/`.
   - **Documents & PDFs** — uploaded PDFs and documents (papers, slides, certificates) stored in `public/files/`.

Every save in Pages CMS commits directly to GitHub, and GitHub Actions automatically validates, tests, builds, and deploys the website.

> Keep private information (home addresses, private phone numbers, transcripts) out of the dashboard, since the repository is public.

---

## 2. Add a project (with multiple photos)

1. Open **Projects → Add an entry**.
2. Fill in **Project title** and **Short summary**.
3. Under **Project images / screenshots**, click to upload or select multiple images.
   - You can upload or select several images at once.
   - Drag thumbnails to reorder them — the first image is automatically used as the cover thumbnail on cards.
4. Optionally add **Your role**, **Tech stack**, **Live demo / Store URL**, **Source code / GitHub URL**, **Dates**, **Key highlights** (short bullet points used on both the project page and your CV), and the **Full project write-up**.
5. Keep **Published** enabled (and **Include on CV** / **Feature on homepage** enabled if desired) and click **Save**.

Your project appears on `/projects/<project-name>/`, on the Projects page, and on your CV.

---

## 2b. Upload PDFs (research papers, slides, thesis) & add images between paragraphs

### Attach PDFs or documents to any item

1. Open any entry under **Custom section items**, **Projects**, **Experience**, or **Education**.
2. Scroll to **PDFs & documents** and upload one or more `.pdf` (or `.doc`, `.docx`, `.ppt`, `.pptx`, `.zip`) files from your computer.
3. Save the entry.
   - On the published page, visitors get a **Read PDF ↗** button at the top, a direct download link in the **Links** sidebar, and an expandable **Document preview (PDF)** viewer right inside the page.
   - If **Include on CV** is enabled, the PDF link is also added automatically to your CV entry.

### Add images between paragraphs in "Full project write-up" / "Full content"

1. Inside the **Full project write-up** or **Full content** rich-text editor, press Enter to place your cursor on a blank line between any two paragraphs.
2. Click the **Image** button in the editor toolbar and upload or pick an image from **Images**.
   - Alternatively, click the **Markdown switcher** icon in the toolbar and write:
     ```markdown
     Paragraph before the image.

     ![Caption describing the figure](/images/diagram.png)

     Paragraph after the image.
     ```
3. On the website, visitors can click any inline image between paragraphs to enlarge it in a fullscreen lightbox.

---

## 3. Add Experience or Education

1. Open **Experience** (or **Education**) → **Add an entry**.
2. Fill in your role and company (or degree and institution), dates, and optional **Currently work here / Currently studying here** toggle.
3. Add concise achievement bullet points under **Responsibilities & achievements** (or **Coursework, thesis, awards**). These appear both on the section page and on your CV automatically.
4. Keep **Published** and **Include on CV** enabled and click **Save**.

Empty built-in sections stay hidden from the navigation bar automatically until you publish at least one entry inside them.

---

## 4. Create a new custom section (e.g. "Anime I've Watched" or "Blog")

1. Open **Sections & Menu Tabs → Add an entry**.
2. Enter a **Section title** (for example, `Anime That I Watched` or `Blog`) and a **URL slug** (for example, `anime` or `blog`, using lowercase letters, numbers, and hyphens).
3. Leave **Section type** as **Custom section (uses Custom section items)**.
4. Set **Menu tab position** (lower numbers appear earlier in the top menu), keep **Published** and **Show tab in top navigation menu** enabled, and click **Save**.
5. Now open **Custom section items → Add an entry**, pick your new section from the **Section** dropdown, add a title, summary, images, details, or content, and save.

Once a custom section has at least one published item (or an introduction body), it automatically appears in your top navigation bar. If there are too many tabs to fit on one row, extra tabs automatically move into the **More** menu.

---

## 5. Hide, reorder, or delete a section

- **Hide temporarily:** Open the section under **Sections & Menu Tabs**, turn off **Published** (hides the section and its items everywhere) or turn off **Show tab in top navigation menu** (removes only the top menu link).
- **Reorder menu tabs:** Change **Menu tab position** (lower numbers appear first) and save.
- **Delete a section:** Delete the section entry in **Sections & Menu Tabs** (delete or reassign any items in **Custom section items** that pointed to it first).

---

## 6. Profile, Skills, and CV PDF export

1. Open **Profile & website settings** to enter your **Full name**, **Professional headline**, **Professional summary**, **Public email**, **Location**, **Profile links** (GitHub, LinkedIn, etc.), and **Skills by category** (e.g., Languages, Frameworks, Tools).
2. Your CV at `/cv/` updates automatically from your Profile, Skills, Experience, Projects, Education, and any custom items with **Include on CV** turned on.
3. Open `/cv/` and click **Print / Save as PDF**, choose **Save as PDF**, select **A4**, and disable browser headers/footers for a clean PDF resume.

---

## 7. Check that your edit went live

1. Open <https://github.com/abu-dojana/abu-dojana.github.io/actions>.
2. Wait for the **Check and publish website** workflow on your commit to turn green.
3. Reload the website to verify your changes. If a build check fails, read the error message in Actions (for example, a duplicate slug or invalid URL), fix the entry in Pages CMS, and save again.
