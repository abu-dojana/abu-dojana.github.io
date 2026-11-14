function setupInlineImageLightbox(reader: HTMLElement, body: HTMLElement) {
  const images = Array.from(body.querySelectorAll<HTMLImageElement>('img')).filter(img => !img.closest('a'));
  if (!images.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'reader-inline-lightbox';
  dialog.setAttribute('aria-label', 'Inline image viewer');

  const frame = document.createElement('div');
  frame.className = 'reader-inline-lightbox-frame';

  const bar = document.createElement('div');
  bar.className = 'reader-inline-lightbox-bar';

  const caption = document.createElement('span');
  caption.className = 'reader-inline-lightbox-caption';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'reader-inline-lightbox-close';
  closeButton.setAttribute('aria-label', 'Close image viewer');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => dialog.close());

  bar.append(caption, closeButton);

  const stage = document.createElement('div');
  stage.className = 'reader-inline-lightbox-stage';

  const fullImg = document.createElement('img');
  stage.append(fullImg);
  frame.append(bar, stage);
  dialog.append(frame);
  reader.append(dialog);

  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  const openLightbox = (img: HTMLImageElement) => {
    fullImg.src = img.currentSrc || img.src;
    fullImg.alt = img.alt;
    caption.textContent = img.title || img.alt || 'Image preview';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  images.forEach(img => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', img.alt ? `Enlarge image: ${img.alt}` : 'Enlarge inline image');
    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(img);
      }
    });
  });
}

function initializeReaders() {
  document.querySelectorAll<HTMLElement>('[data-reader]').forEach(reader => {
    if (reader.dataset.readerInitialized) return;
    reader.dataset.readerInitialized = 'true';

    const sidebar = reader.querySelector<HTMLDetailsElement>('[data-reader-sidebar]');
    if (sidebar) {
      const mobile = window.matchMedia('(max-width: 760px)');
      const setSidebarForViewport = () => { sidebar.open = !mobile.matches; };
      setSidebarForViewport();
      mobile.addEventListener('change', setSidebarForViewport);
    }

    const body = reader.querySelector<HTMLElement>('[data-reader-body]');
    if (body) setupInlineImageLightbox(reader, body);
    const contents = reader.querySelector<HTMLElement>('[data-reader-toc]');
    const list = reader.querySelector<HTMLOListElement>('[data-reader-toc-list]');
    const rail = reader.querySelector<HTMLElement>('[data-reader-rail]');
    if (!body || !contents || !list) return;

    const headings = Array.from(body.querySelectorAll<HTMLHeadingElement>('h2, h3, h4')).filter(heading => heading.textContent?.trim());
    const headingSet = new Set<Element>(headings);
    const usedIds = new Set(Array.from(document.querySelectorAll<HTMLElement>('[id]')).filter(element => !headingSet.has(element)).map(element => element.id));
    const links: HTMLAnchorElement[] = [];
    headings.forEach((heading, index) => {
      const text = heading.textContent!.trim();
      const slug = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
      const base = heading.id || `reader-section-${slug || index + 1}`;
      let id = base;
      let suffix = 2;
      while (usedIds.has(id)) id = `${base}-${suffix++}`;
      usedIds.add(id);
      heading.id = id;

      const item = document.createElement('li');
      item.className = `reader-toc-level-${heading.tagName.slice(1)}`;
      const link = document.createElement('a');
      link.href = `#${encodeURIComponent(id)}`;
      link.textContent = text;
      item.append(link);
      list.append(item);
      links.push(link);
    });

    contents.hidden = headings.length === 0;
    if (!headings.length && rail?.dataset.readerStatic !== 'true') {
      rail?.setAttribute('hidden', '');
      reader.classList.add('reader-layout--without-rail');
    }

    const markCurrentHeading = () => {
      links.forEach(link => {
        if (link.hash === window.location.hash) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    markCurrentHeading();
    window.addEventListener('hashchange', markCurrentHeading);
    if (window.location.hash) {
      try {
        const initial = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (initial && body.contains(initial)) initial.scrollIntoView({ block: 'start' });
      } catch { /* A malformed URL fragment must not interrupt article navigation. */ }
    }
  });
}

initializeReaders();
document.addEventListener('astro:page-load', initializeReaders);
