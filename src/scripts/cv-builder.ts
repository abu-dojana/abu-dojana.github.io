import {
  CV_DEMO_STORAGE_KEY, CV_STORAGE_KEY, createDefaultCvState, deriveCvView,
  moveCvEntry, moveCvSection, parseCvState, serializeCvState,
  setCvEntrySelected, setCvSectionSelected, type CvModel,
} from '../lib/cv';

const root = document.querySelector<HTMLElement>('[data-cv-builder]');

if (root) {
  const modelElement = root.querySelector<HTMLScriptElement>('#cv-models');
  const models = JSON.parse(modelElement?.textContent || '{}') as { real: CvModel; demo: CvModel };
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  const model = demo ? models.demo : models.real;
  const workspace = root.querySelector<HTMLElement>('[data-cv-builder-workspace]')!;
  const setup = root.querySelector<HTMLElement>('[data-cv-builder-setup]')!;

  if (!model?.ready) {
    setup.hidden = false;
    if (demo) {
      setup.querySelector('h2')!.textContent = 'No example CV entries yet.';
      setup.querySelector('p')!.textContent = 'Add a published example entry, choose a CV section, and turn on CV inclusion to try this layout.';
      const link = setup.querySelector<HTMLAnchorElement>('a');
      if (link) link.hidden = true;
    }
  } else {
    workspace.hidden = false;
    const version = root.querySelector<HTMLElement>(`[data-cv-version="${demo ? 'demo' : 'real'}"]`)!;
    version.hidden = false;
    const preview = version.querySelector<HTMLElement>('[data-cv-document]')!;
    const controls = root.querySelector<HTMLElement>('[data-cv-controls]')!;
    const storageNote = root.querySelector<HTMLElement>('[data-cv-storage-note]')!;
    const saveStatus = root.querySelector<HTMLElement>('[data-cv-save-status]')!;
    const printButton = root.querySelector<HTMLButtonElement>('[data-cv-print]')!;
    const headlineInput = root.querySelector<HTMLInputElement>('[data-cv-headline-input]')!;
    const summaryInput = root.querySelector<HTMLTextAreaElement>('[data-cv-summary-input]')!;
    const contactInput = root.querySelector<HTMLInputElement>('[data-cv-contact-input]')!;
    const storageKey = demo ? CV_DEMO_STORAGE_KEY : CV_STORAGE_KEY;
    let state = createDefaultCvState(model);
    let storageAvailable = true;

    function storageUnavailable() {
      storageAvailable = false;
      storageNote.hidden = false;
      storageNote.textContent = 'Browser storage is unavailable. Your choices still work on this page, but will not be remembered after you leave.';
    }

    try { state = parseCvState(localStorage.getItem(storageKey), model); }
    catch { storageUnavailable(); }

    root.querySelector<HTMLElement>('[data-cv-mode-note]')!.textContent = demo
      ? 'Example mode. Sample entries stay labelled in your preview and printout.'
      : 'This changes your own CV preview. The public website stays as it is.';

    function persistSelection() {
      if (!storageAvailable) return;
      try { localStorage.setItem(storageKey, serializeCvState(state)); }
      catch { storageUnavailable(); }
    }

    function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
      const node = document.createElement(tag);
      node.className = className;
      if (text) node.textContent = text;
      return node;
    }

    function moveButton(label: string, direction: -1 | 1, disabled: boolean, focusKey: string, callback: () => void) {
      const button = element('button', 'cv-move-button', direction < 0 ? '↑' : '↓');
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.title = label;
      button.disabled = disabled;
      button.dataset.cvFocus = focusKey;
      button.addEventListener('click', callback);
      return button;
    }

    function checkbox(label: string, checked: boolean, focusKey: string, callback: (included: boolean) => void) {
      const wrapper = element('label', 'cv-check-label');
      const input = element('input');
      input.type = 'checkbox';
      input.checked = checked;
      input.dataset.cvFocus = focusKey;
      const caption = element('span', '', label);
      wrapper.append(input, caption);
      input.addEventListener('change', () => callback(input.checked));
      return wrapper;
    }

    function changeSelection(next: typeof state, announcement = '') {
      state = next;
      persistSelection();
      render(announcement);
    }

    function render(announcement = '') {
      const activeKey = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.cvFocus : undefined;
      const visible = deriveCvView(model, state);
      const visibleSections = new Map(visible.map((section) => [section.id, new Set(section.entries.map((entry) => entry.id))]));
      const sections = [...model.sections].sort((a, b) => state.sectionOrder.indexOf(a.id) - state.sectionOrder.indexOf(b.id));
      const documentSections = preview.querySelector<HTMLElement>('[data-cv-document-sections]')!;
      const sectionNodes = new Map([...preview.querySelectorAll<HTMLElement>('[data-cv-section]')].map((node) => [node.dataset.cvSection, node]));
      controls.replaceChildren();

      sections.forEach((section, sectionIndex) => {
        const selected = state.selectedSectionIds.includes(section.id);
        const group = element('fieldset', 'cv-option-section');
        const legend = element('legend', 'cv-sr-only', section.title);
        group.append(legend);
        const heading = element('div', 'cv-option-section-heading');
        heading.append(checkbox(section.title, selected, `section:${section.id}`, (included) => {
          changeSelection(setCvSectionSelected(state, model, section.id, included));
        }));
        const moves = element('div', 'cv-move-controls');
        moves.append(
          moveButton(`Move ${section.title} section up`, -1, sectionIndex === 0, `section-up:${section.id}`, () => {
            changeSelection(moveCvSection(state, model, section.id, -1), `${section.title} moved up.`);
          }),
          moveButton(`Move ${section.title} section down`, 1, sectionIndex === sections.length - 1, `section-down:${section.id}`, () => {
            changeSelection(moveCvSection(state, model, section.id, 1), `${section.title} moved down.`);
          }),
        );
        heading.append(moves);
        group.append(heading);

        const list = element('div', 'cv-option-entries');
        const entries = [...section.entries].sort((a, b) => state.entryOrder.indexOf(a.id) - state.entryOrder.indexOf(b.id));
        const sectionNode = sectionNodes.get(section.id)!;
        sectionNode.hidden = !visibleSections.has(section.id);
        documentSections.append(sectionNode);
        const entryNodes = new Map([...sectionNode.querySelectorAll<HTMLElement>('[data-cv-entry]')].map((node) => [node.dataset.cvEntry, node]));
        const documentEntries = sectionNode.querySelector<HTMLElement>('[data-cv-section-entries]')!;

        entries.forEach((entry, entryIndex) => {
          const row = element('div', 'cv-option-entry');
          if (!selected) row.classList.add('cv-option-entry-muted');
          row.append(checkbox(entry.title, state.selectedEntryIds.includes(entry.id), `entry:${entry.id}`, (included) => {
            changeSelection(setCvEntrySelected(state, model, entry.id, included));
          }));
          const entryMoves = element('div', 'cv-move-controls');
          entryMoves.append(
            moveButton(`Move ${entry.title} up`, -1, entryIndex === 0, `entry-up:${entry.id}`, () => {
              changeSelection(moveCvEntry(state, model, entry.id, -1), `${entry.title} moved up.`);
            }),
            moveButton(`Move ${entry.title} down`, 1, entryIndex === entries.length - 1, `entry-down:${entry.id}`, () => {
              changeSelection(moveCvEntry(state, model, entry.id, 1), `${entry.title} moved down.`);
            }),
          );
          row.append(entryMoves);
          list.append(row);
          const entryNode = entryNodes.get(entry.id)!;
          entryNode.hidden = !visibleSections.get(section.id)?.has(entry.id);
          documentEntries.append(entryNode);
        });

        group.append(list);
        controls.append(group);
      });

      const count = visible.reduce((sum, section) => sum + section.entries.length, 0);
      printButton.disabled = count === 0;
      preview.querySelector<HTMLElement>('[data-cv-empty-selection]')!.hidden = count > 0;
      saveStatus.textContent = `${announcement ? `${announcement} ` : ''}${count} ${count === 1 ? 'entry' : 'entries'} in your CV.`;
      if (activeKey) {
        const nextFocus = [...controls.querySelectorAll<HTMLElement>('[data-cv-focus]')].find((node) => node.dataset.cvFocus === activeKey);
        if (nextFocus && !(nextFocus instanceof HTMLButtonElement && nextFocus.disabled)) nextFocus.focus({ preventScroll: true });
        else if (nextFocus) nextFocus.closest('fieldset')?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
      }
    }

    function updateText() {
      const headline = preview.querySelector<HTMLElement>('[data-cv-headline]')!;
      const summary = preview.querySelector<HTMLElement>('[data-cv-summary]')!;
      headline.textContent = headlineInput.value;
      headline.hidden = !headlineInput.value.trim();
      summary.textContent = summaryInput.value;
      summary.hidden = !summaryInput.value.trim();
      const contact = preview.querySelector<HTMLElement>('[data-cv-contact-override]')!;
      const publicContact = preview.querySelector<HTMLElement>('[data-cv-public-contact]')!;
      contact.textContent = contactInput.value;
      contact.hidden = !contactInput.value.trim();
      publicContact.hidden = Boolean(contactInput.value.trim()) || !(model.profile.email || model.profile.location || model.profile.links.length);
    }

    function resetText() {
      headlineInput.value = model.profile.headline;
      summaryInput.value = model.profile.summary;
      contactInput.value = '';
      updateText();
    }

    headlineInput.addEventListener('input', updateText);
    summaryInput.addEventListener('input', updateText);
    contactInput.addEventListener('input', updateText);
    root.querySelector<HTMLButtonElement>('[data-cv-reset]')!.addEventListener('click', () => {
      state = createDefaultCvState(model);
      try { localStorage.removeItem(storageKey); } catch { storageUnavailable(); }
      resetText();
      render('Default selection restored. Text edits cleared.');
    });
    printButton.addEventListener('click', () => window.print());
    resetText();
    render();
  }
}
