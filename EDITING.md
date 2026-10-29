# Editing your website

Your public website is <https://abu-dojana.github.io/>. Your editing dashboard is <https://app.pagescms.org/>. The dashboard saves files to GitHub; a successful publishing workflow updates the website. You do not need a development environment for ordinary content edits.

## Open the dashboard

1. Sign in to Pages CMS with the GitHub account that owns `abu-dojana/abu-dojana.github.io`.
2. Authorize its GitHub App for this repository if it has not been connected yet.
3. Open the repository and select **master** for live website edits. The development branch is for testing before launch.
4. The sidebar should show **Entries**, **Categories**, **Pages**, **Profile, homepage & navigation**, **CV sections**, and media.

The public repository, including its history, is readable by anyone. A draft stays off the rendered website, but its file is still public. Keep private notes, addresses, transcripts, and private contact details out of this dashboard.

## Make the starter yours

Open **Profile, homepage & navigation**. Enter your website name, CV name, headline, short introduction, and any contact/profile links you want public. Missing optional fields are hidden. LinkedIn is optional.

Edit the homepage heading and introduction in the same form. Replace the example About page under **Pages**. When you have real content, turn off **Preview mode** to remove the starter notice and allow search-engine indexing. Search engines decide when to revisit the site; the toggle is not an instant indexing guarantee.

Example entries have **This is example content** switched on. Replace the example text with your own accurate information before switching that off. Examples never appear in your real default CV. Their labels remain visible in the demonstration CV and its PDF.

## Add anything: a story, experience, project, or adventure

1. Open **Entries** and choose **New entry**.
2. Enter a title, short description, and **URL name** such as `first-hill-walk`. A URL name uses lowercase letters, numbers, and hyphens.
3. Select any categories, and add optional tags, dates, cover image, links, and labeled details.
4. Write the full story using the formatted editor. Use the source switch for Markdown or code blocks if needed.
5. Keep **Publish on the website** off while drafting. Switch it on when ready.
6. Switch on **Feature on the homepage** if it should appear among selected entries.
7. Save. This creates a commit on the selected GitHub branch.

An entry can be in several categories without creating duplicate stories. Moving it between categories does not change `/entries/its-url-name/`. Keep a URL name unchanged once you have shared its link; changing it changes the public address.

### Add an entirely new category

Open **Categories → New entry**. Give it a name (for example **Adventures**), URL name, introduction, and optional list position. Save it, then choose it on any entries. You do not need to edit code or configuration.

Category names do not imply professional qualifications. Describe employment, independent work, volunteering, training, and planned activities accurately in the entry itself.

### Put the category in the menu

Open **Profile, homepage & navigation → Navigation menu**. Add **A category**, enter the menu label, select the category by its title, and enable visibility. Reorder the list to change menu order, then save. New categories are not added to the menu automatically.

Menu labels are independent of page headings. Use **A page** for standalone pages, **External website** for an external link, or the built-in Home, Explore, and CV destinations. Turn visibility off to hide a link without removing its destination.

## Add a standalone page

Open **Pages → New entry**. Supply a heading, URL name, description, and body. Enable publishing and save. Add it to navigation if wanted. The address is `/pages/its-url-name/`; entries, categories, and pages use separate URL namespaces.

Hiding a menu item does not make its destination private. Unpublishing a page removes it from the website after a successful rebuild. Remove or hide its navigation item first so visitors are not left with a broken link.

## Photos and links

Cover images and formatted-body images use the **Images** media library. Upload a JPG, PNG, WebP, AVIF, GIF, or SVG and select it in the editor. Images are committed to `public/images` and appear under `/images` on the website. Describe cover images in **Image description** for accessibility. Prefer sensibly sized images rather than full camera-resolution files.

Supporting links can point to public code, a demonstration, a document, or anything relevant. Use complete `https://` URLs or site paths beginning with `/`. Website content does not execute arbitrary embedded scripts.

## CV content and PDF export

1. Under **CV sections**, create any headings you need, such as Education, Experience, Research, Community, or Selected work. Lower position numbers appear first by default.
2. In an entry's **CV version** group, enable **Offer this entry in the CV builder**, choose a section, and write a short title/subtitle and concise bullets.
3. Use the CV date field for a readable date range. Keep an in-progress course or planned license accurately labeled. Completing a course is not automatically a professional certification.
4. Save. The website and CV use the same entry, with a shorter CV presentation.

The public CV builder lets visitors select and order published CV-eligible entries. It cannot edit your website. Its controls allow a headline, summary, and temporary contact overrides. Selection and order are remembered only in that browser. Temporary contact details and summary edits are not saved or synchronized; refreshing the page clears them.

Use **Print / Save as PDF** and choose your browser's **Save as PDF** destination. Select A4, disable browser headers/footers if they add dates or URLs, and inspect the print preview before saving. The CV is always light on paper, even when the website is dark. Large selections can span several pages. No automatic one-click PDF-download service is included.

The default CV needs a real name and eligible real content. Until then it shows a setup message and offers a labeled demonstration. Demonstration output is not a real CV and keeps its example notice when printed.

## Light and dark mode

Use the website's **System / Light / Dark** control. System follows the device setting. An explicit choice is remembered on that browser. The setting changes your view, not the appearance chosen by other visitors. PDF printing always uses a white background and dark text.

## Did the edit publish?

1. Confirm you edited **master**, saved, and enabled publishing on the entry/page.
2. Open the repository's **Actions** tab: <https://github.com/abu-dojana/abu-dojana.github.io/actions>.
3. Find the **Check and publish website** run for your commit. Wait for build and deployment to finish.
4. Open the live page and reload it. A successful CMS save alone does not prove a deployment succeeded.

If validation or tests fail, the previous successful site remains available. Open the failed step to read its error. Common causes are duplicate URL names, references to a deleted category/CV section/page, or an invalid link/date. Correct the affected fields and save again. Before deleting a category or CV section, remove or replace references to it on entries and menu items.

If the dashboard saves on a development branch, those changes are not live until merged into `master`. The implementation must pull those dashboard edits before merging so they are retained.

## Recovery

GitHub keeps a history of content changes. Open an affected file's history to find the previous version; restore it as a new commit rather than rewriting history. For a failed deployment, use the Actions error and fix the source, or revert the relevant commit.

The original AcademicPages boilerplate is preserved by the tag **legacy-academicpages-2026-10-29**. It predates the Astro replacement. The repository history and that tag provide a recovery point; do not delete the tag or force-push over the production history.

## Connect a custom domain later

After buying a domain, verify ownership in GitHub, configure it under **Repository Settings → Pages**, and add the DNS records specified by GitHub. Set the repository Actions variable **SITE_URL** to the full custom origin (for example `https://your-domain.com`), then trigger **Check and publish website** again so canonical URLs match. Set up the root and `www` records and confirm HTTPS and redirects.

Follow the current official instructions rather than copying old IP addresses: <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>. You can keep buying only the domain; GitHub hosts the site separately.
