export function initializeGalleries() {
  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach(root => {
    if (root.dataset.galleryInitialized) return;
    root.dataset.galleryInitialized = 'true';

    let images: string[] = [];
    try {
      const parsed = JSON.parse(root.dataset.images || '[]');
      if (Array.isArray(parsed)) images = parsed.filter((value): value is string => typeof value === 'string');
    } catch {}
    if (!images.length) return;

    const title = root.dataset.title || 'Project';
    const mainImg = root.querySelector<HTMLImageElement>('[data-gallery-main]');
    const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');
    const thumbs = [...root.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];
    const dialog = root.querySelector<HTMLDialogElement>('[data-gallery-dialog]');
    const dialogImg = root.querySelector<HTMLImageElement>('[data-gallery-dialog-img]');
    const dialogCaption = root.querySelector<HTMLElement>('[data-gallery-dialog-caption]');

    let active = 0;

    function altText(index: number): string {
      return images.length > 1 ? `${title} — image ${index + 1} of ${images.length}` : `${title} preview`;
    }

    function select(nextIndex: number) {
      active = ((nextIndex % images.length) + images.length) % images.length;
      const src = images[active];
      const alt = altText(active);
      if (mainImg) {
        mainImg.src = src;
        mainImg.alt = alt;
      }
      if (dialogImg) {
        dialogImg.src = src;
        dialogImg.alt = alt;
      }
      if (counter) {
        counter.textContent = `${active + 1} / ${images.length}`;
      }
      if (dialogCaption) {
        dialogCaption.textContent = images.length > 1 ? `${title} · ${active + 1} / ${images.length}` : title;
      }
      thumbs.forEach((thumb, index) => {
        thumb.setAttribute('aria-current', index === active ? 'true' : 'false');
      });
    }

    root.querySelectorAll('[data-gallery-prev], [data-gallery-dialog-prev]').forEach(btn => {
      btn.addEventListener('click', () => select(active - 1));
    });
    root.querySelectorAll('[data-gallery-next], [data-gallery-dialog-next]').forEach(btn => {
      btn.addEventListener('click', () => select(active + 1));
    });

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const index = Number.parseInt(thumb.dataset.galleryThumb || '0', 10);
        if (!Number.isNaN(index)) select(index);
      });
    });

    root.querySelectorAll('[data-gallery-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!dialog) return;
        select(active);
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      });
    });

    root.querySelector('[data-gallery-close]')?.addEventListener('click', () => {
      dialog?.close();
    });

    dialog?.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });

    dialog?.addEventListener('keydown', event => {
      if (images.length <= 1) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        select(active - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        select(active + 1);
      }
    });
  });
}
