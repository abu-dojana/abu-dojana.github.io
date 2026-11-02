# Edit your website through Pages

- Website: <https://abu-dojana.github.io/>
- Dashboard: <https://app.pagescms.org/>
- Repository: <https://github.com/abu-dojana/abu-dojana.github.io>

The normal workflow is **Pages → choose a page → Items → Add item → Save**. Make a Projects page, an Experience timeline, a Skills list, an Adventures collection, or something completely different. You do not need to create a category, a separate entry, or a menu record first.

## Open the dashboard

1. Sign in to Pages CMS with the GitHub account that owns the repository.
2. Authorize its GitHub App for `abu-dojana/abu-dojana.github.io` if needed.
3. Open the repository and choose **main**, the live publishing branch.
4. The sidebar shows **Pages**, **Profile & website settings**, **CV sections**, and images.

The connection must be authorized before browser editing works. A successful dashboard save creates a GitHub commit; a successful publishing workflow then updates the website. Those are separate steps.

All repository files and their history are public. Draft status keeps content off the website, but does not make its file private. Keep private notes, home addresses, transcripts, and private contact details out of the dashboard.

## Add a page

Open **Pages → New page** (the dashboard may label this **New entry** within the Pages collection).

1. Enter a **Page name**, such as Projects, Experience, Skills, Adventures, or Blog.
2. Enter a **URL name**, such as `projects` or `adventures`. Use lowercase letters, numbers, and hyphens.
3. Choose a layout:

   | Layout | Useful for |
   | --- | --- |
   | Cards | Projects, adventures, illustrated collections |
   | List | Skills, hobbies, short notes, compact collections |
   | Timeline | Experience, education, progress, a journey |
   | Article | About, an introduction, a standalone long page |

4. Add an optional short description and **Page introduction**.
5. Leave **Show this page in the menu** enabled if you want a menu link. Set an optional short menu label and page position; lower numbers come first.
6. Enable **Publish on the website** and save when ready.

Published pages with the menu option enabled appear automatically. Their names, menu labels, layouts, and positions are editable in the same form. The menu label can differ from the page heading.

The address is `/pages/its-url-name/`. Keep the URL name unchanged after sharing a link; changing it changes the address.

## Add things inside a page

For example, to add a project:

**Pages → Projects → Items → Add item**

Enter its title and any details you want. For a skill or hobby, a title alone is enough. Other fields are optional:

- A short description and a longer formatted story.
- Cover image and image description.
- Tags, dates, and progress.
- Supporting links to code, a demonstration, a report, or another website.
- Labeled details such as a role, organization, location, or equipment type.
- A concise CV presentation, if the item should be available in the CV builder.

Items are collapsed by title. Expand one to edit it, add another with the Items control, and reorder the list to change their order on the page. Enable **Publish this item**, then save the page. The parent page must also be published.

Leave **Custom item URL name** blank for a stable automatic address based on the item's record ID. A friendly custom name is optional, but must be unique across every page. Keep record IDs unchanged so links and saved CV selections remain valid.

### Hide or remove content

- Turn off **Publish this item** to hide an item, then save its page.
- Turn off the page's publishing switch to hide the whole page and its items. After a successful rebuild, those items also disappear from other public listings and the CV builder.
- Turn off **Show this page in the menu** to remove only the menu link while keeping the page public.
- Remove an item from the page's Items list to delete it, then save. GitHub history retains the previous version.
- Delete a page through Pages CMS to remove it. Remove any optional manual shortcut to it from website settings first.

Hiding a link does not make its destination private. Deleting content does not erase its history from the public repository.

## Make the starter yours

Under **Profile & website settings**, enter your website name, CV name, headline, short introduction, and any public contact/profile links. Optional fields can stay blank; LinkedIn is optional.

Edit the homepage heading, introduction, and footer in the same form. The homepage lists your published pages; change their positions through each page's **Page position** field. Open your About page under **Pages** and use Article layout for its introduction. The starter About page is titled **Room to keep becoming.** and has **About** as its short menu label.

Example items are visibly labeled and excluded from your real default CV. Replace their text with your actual work before turning off **This is example content**. If a whole page is marked as an example, all its items are treated as examples too, regardless of each item's setting.

**Preview mode** shows a starter notice and asks search engines not to index the site. Turn it off after adding real content. Search engines decide when to revisit; this is not an instant indexing guarantee.

### Optional extra navigation

Ordinary pages need no separate menu setup. Their menu visibility, label, and position fields are the primary controls.

Use **Optional extra navigation links** for Home, CV, and external websites. It is not required when creating a normal page.

An existing-page override, if present, can supply a fallback menu label or hide that page's link. It does not create a second link or change the page's position. A page's own short menu label takes precedence; use its **Page position** field to set order.

## Photos and links

Cover images and images inside formatted text use the image library. Upload a JPG, PNG, WebP, AVIF, GIF, or SVG and select it in the editor. Files are stored in `public/images` and published under `/images`.

Describe covers in **Image description** for people who cannot see them. Prefer sensibly sized images rather than full camera-resolution files. Use complete `https://` addresses for external links, or paths beginning with `/` for website links. Content does not execute arbitrary embedded scripts.

## CV content and PDF export

1. Under **CV sections**, create headings such as Education, Experience, Research, Community, or Selected work. Lower position numbers appear first by default.
2. Open an item inside its page and expand **CV version**.
3. Enable **Offer this item in the CV builder**, select a CV section, and write a short title/subtitle and concise bullets.
4. Use the CV date field for a readable date range, then save the page.

CV sections are independent of page names. An item on Adventures could appear under Community or stay out of the CV entirely. Only published items on published pages are eligible. Unpublishing or deleting a page also removes its items from the CV builder.

Describe employment, independent work, volunteering, and training accurately. A planned license remains planned until earned. Course completion is not automatically a professional certification.

The public CV builder lets visitors select and order eligible items and sections. It cannot edit the website. Selections and order are remembered only in the current browser. Temporary headline, summary, and contact overrides remain in memory and are not saved or synchronized; reloading clears them.

Use **Print / Save as PDF** and choose the browser's **Save as PDF** destination. Select A4, turn off browser headers/footers if they add dates or URLs, and inspect the preview. Large selections can span several pages. The CV is always light on paper, even when the website is dark.

The real default CV needs a name and at least one real eligible item. Until then it offers a labeled demonstration. Example output retains its notice in the preview and PDF and should not be used as an application CV.

## Light and dark mode

Use **System / Light / Dark** on the website. System follows the device preference. An explicit choice is remembered on that browser and changes only that visitor's view. Printing uses a white background and dark text.

## Check whether an edit published

1. Confirm the dashboard is on **main**, you saved, and both the page and intended items are published.
2. Open <https://github.com/abu-dojana/abu-dojana.github.io/actions>.
3. Find **Check and publish website** for the saved commit and wait for build and deployment to finish.
4. Reload the live page and confirm the change appears.

A successful dashboard save alone does not prove deployment succeeded. If validation or tests fail, the last successful website stays available. Read the failed step's error, correct the fields, and save again. Common causes are duplicate URL names, missing cover descriptions, invalid dates/links, or an item referring to a deleted CV section.

Before deleting a CV section, reassign or clear it on affected items. Update or remove a manual page shortcut before deleting/unpublishing its destination.

Changes saved on a development branch are not live until merged into **main**. Pull dashboard changes into the checkout before merging so they are retained.

## Recovery

GitHub keeps content history. Open the affected page file's history, find the previous version, and restore it as a new commit rather than rewriting history. A page file contains its introduction and nested items.

The original AcademicPages boilerplate is preserved by **legacy-academicpages-2026-10-29**. Keep that tag and the production history. Restoring the starter also requires returning GitHub Pages to its former branch-based Jekyll publishing setting; the new site uses Astro through GitHub Actions.

## Connect a custom domain later

Verify domain ownership in GitHub, configure it under **Repository Settings → Pages**, and add GitHub's specified DNS records. Set the repository Actions variable **SITE_URL** to the full custom origin, such as `https://your-domain.com`, then run **Check and publish website** so canonical URLs match. Configure root and `www` records and verify HTTPS and redirects.

Use the current official instructions rather than old IP addresses: <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>. Domain registration and GitHub hosting are separate services.
