function initializeExplore() {
  const form = document.querySelector<HTMLFormElement>('#explore-filters');
  if (!form || form.dataset.initialized) return;
  form.dataset.initialized = 'true';
  const search = form.querySelector<HTMLInputElement>('#entry-search')!;
  const category = form.querySelector<HTMLSelectElement>('#category-filter')!;
  const tag = form.querySelector<HTMLSelectElement>('#tag-filter')!;
  const cards = Array.from(document.querySelectorAll<HTMLElement>('#explore-results [data-entry-card]')).map((node) => ({
    node,
    search: normalize(node.dataset.search || ''),
    categories: JSON.parse(node.dataset.categories || '[]') as string[],
    tags: JSON.parse(node.dataset.tags || '[]') as string[],
  }));
  const count = document.querySelector<HTMLElement>('#result-count')!;
  const empty = document.querySelector<HTMLElement>('#no-results')!;
  const clearEmpty = document.querySelector<HTMLButtonElement>('#clear-empty-filters')!;
  const params = new URL(window.location.href).searchParams;
  search.value = params.get('q') || '';
  const requestedCategory = params.get('category');
  category.value = Array.from(category.options).find((option) => option.dataset.slug === requestedCategory)?.value || '';
  const requestedTag = params.get('tag') || '';
  tag.value = Array.from(tag.options).some((option) => option.value === requestedTag) ? requestedTag : '';

  function apply(updateUrl = true) {
    const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const matches = words.every((word) => card.search.includes(word)) && (!category.value || card.categories.includes(category.value)) && (!tag.value || card.tags.includes(tag.value));
      card.node.hidden = !matches;
      if (matches) visible++;
    }
    const filtered = !!(search.value.trim() || category.value || tag.value);
    count.textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'}${filtered ? ` of ${cards.length}` : ''}`;
    empty.hidden = visible > 0;
    if (updateUrl) {
      const url = new URL(window.location.href);
      const values: Record<string, string> = { q: search.value.trim(), category: category.selectedOptions[0]?.dataset.slug || '', tag: tag.value };
      for (const [key, value] of Object.entries(values)) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); apply(); });
  form.addEventListener('input', () => apply());
  form.addEventListener('change', () => apply());
  form.addEventListener('reset', () => { search.value = ''; category.value = ''; tag.value = ''; apply(); });
  clearEmpty.addEventListener('click', () => { form.reset(); search.focus(); });
  clearEmpty.hidden = false;
  form.hidden = false;
  apply(false);
}

function normalize(value: string) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(); }

initializeExplore();
document.addEventListener('astro:page-load', initializeExplore);
