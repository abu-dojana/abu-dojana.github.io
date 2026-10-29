import type { Entry, Link, SiteContent } from './types';

export interface CvEntry {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  bullets: string[];
  links: Link[];
  progress: Entry['progress'];
  example: boolean;
}

export interface CvGroup {
  id: string;
  title: string;
  entries: CvEntry[];
}

export interface CvModel {
  demo: boolean;
  ready: boolean;
  profile: {
    name: string;
    headline: string;
    summary: string;
    email: string;
    location: string;
    links: Link[];
    skills: string[];
  };
  sections: CvGroup[];
}

/** Only identifiers and ordering are persisted. Free text never belongs here. */
export interface CvState {
  version: 1;
  selectedEntryIds: string[];
  selectedSectionIds: string[];
  entryOrder: string[];
  sectionOrder: string[];
}

export const CV_STATE_VERSION = 1;
export const CV_STORAGE_KEY = 'portfolio.cv.selection.v1';
export const CV_DEMO_STORAGE_KEY = 'portfolio.cv.demo-selection.v1';

const unique = (values: string[]) => [...new Set(values)];
const orderByRank = <T extends { id: string }>(values: T[], order: string[]) => {
  const ranks = new Map(order.map((id, index) => [id, index]));
  return [...values].sort((a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity));
};

function entryDate(entry: Entry): string {
  if (entry.cv.date.trim()) return entry.cv.date.trim();
  return [entry.date, entry.endDate].filter(Boolean).join(' – ');
}

export function createCvModel(site: SiteContent, demo = false): CvModel {
  const entries = site.entries
    .filter((entry) => entry.published && entry.cv.include && (demo || !entry.example))
    .sort((a, b) => a.cv.order - b.cv.order || a.title.localeCompare(b.title));
  const sectionDefinitions = [...site.cvSections].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const knownSections = new Set(sectionDefinitions.map((section) => section.id));
  const fallbackId = '__unassigned_cv_entries__';
  if (entries.some((entry) => !knownSections.has(entry.cv.section))) {
    sectionDefinitions.push({ id: fallbackId, title: 'Selected experience', order: Infinity });
  }

  const sections = sectionDefinitions.map((section): CvGroup => ({
    id: section.id,
    title: section.title,
    entries: entries
      .filter((entry) => (knownSections.has(entry.cv.section) ? entry.cv.section : fallbackId) === section.id)
      .map((entry) => ({
        id: entry.id,
        title: entry.cv.title.trim() || entry.title,
        subtitle: entry.cv.subtitle.trim(),
        date: entryDate(entry),
        bullets: entry.cv.bullets.map((bullet) => bullet.trim()).filter(Boolean),
        links: entry.links,
        progress: entry.progress,
        example: entry.example,
      })),
  })).filter((section) => section.entries.length > 0);

  const profile = demo
    ? {
      name: 'Example profile',
      headline: 'An illustrative CV layout',
      summary: 'This preview uses clearly labelled examples to demonstrate the layout. Replace them with your own experience before applying.',
      email: '', location: '', links: [], skills: [],
    }
    : {
      name: site.settings.name.trim(),
      headline: site.settings.headline.trim(),
      summary: site.settings.bio.trim(),
      email: site.settings.email.trim(),
      location: site.settings.location.trim(),
      links: site.settings.links,
      skills: site.settings.skills.map((skill) => skill.trim()).filter(Boolean),
    };

  return { demo, profile, sections, ready: Boolean(profile.name && sections.length) };
}

export function createDefaultCvState(model: CvModel): CvState {
  const entryIds = unique(model.sections.flatMap((section) => section.entries.map((entry) => entry.id)));
  const sectionIds = unique(model.sections.map((section) => section.id));
  return {
    version: CV_STATE_VERSION,
    selectedEntryIds: [...entryIds],
    selectedSectionIds: [...sectionIds],
    entryOrder: [...entryIds],
    sectionOrder: [...sectionIds],
  };
}

/** Drop stale IDs, keep deliberate exclusions, and append new IDs to ordering only. */
export function reconcileCvState(state: CvState, model: CvModel): CvState {
  const defaults = createDefaultCvState(model);
  const entryIds = new Set(defaults.entryOrder);
  const sectionIds = new Set(defaults.sectionOrder);
  return {
    version: CV_STATE_VERSION,
    selectedEntryIds: unique(state.selectedEntryIds).filter((id) => entryIds.has(id)),
    selectedSectionIds: unique(state.selectedSectionIds).filter((id) => sectionIds.has(id)),
    entryOrder: unique([...state.entryOrder.filter((id) => entryIds.has(id)), ...defaults.entryOrder]),
    sectionOrder: unique([...state.sectionOrder.filter((id) => sectionIds.has(id)), ...defaults.sectionOrder]),
  };
}

export function parseCvState(raw: string | null, model: CvModel): CvState {
  if (!raw) return createDefaultCvState(model);
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return createDefaultCvState(model);
    const record = value as Record<string, unknown>;
    const keys = ['selectedEntryIds', 'selectedSectionIds', 'entryOrder', 'sectionOrder'] as const;
    if (record.version !== CV_STATE_VERSION || !keys.every((key) =>
      Array.isArray(record[key]) && record[key].every((id: unknown) => typeof id === 'string'),
    )) return createDefaultCvState(model);
    return reconcileCvState({
      version: CV_STATE_VERSION,
      selectedEntryIds: record.selectedEntryIds as string[],
      selectedSectionIds: record.selectedSectionIds as string[],
      entryOrder: record.entryOrder as string[],
      sectionOrder: record.sectionOrder as string[],
    }, model);
  } catch {
    return createDefaultCvState(model);
  }
}

/** Explicit whitelist prevents accidental persistence of private editor fields. */
export function serializeCvState(state: CvState): string {
  return JSON.stringify({
    version: CV_STATE_VERSION,
    selectedEntryIds: state.selectedEntryIds,
    selectedSectionIds: state.selectedSectionIds,
    entryOrder: state.entryOrder,
    sectionOrder: state.sectionOrder,
  });
}

export function deriveCvView(model: CvModel, state: CvState): CvGroup[] {
  const safe = reconcileCvState(state, model);
  const selectedEntries = new Set(safe.selectedEntryIds);
  const selectedSections = new Set(safe.selectedSectionIds);
  return orderByRank(model.sections, safe.sectionOrder)
    .filter((section) => selectedSections.has(section.id))
    .map((section) => ({
      ...section,
      entries: orderByRank(section.entries, safe.entryOrder).filter((entry) => selectedEntries.has(entry.id)),
    }))
    .filter((section) => section.entries.length > 0);
}

function toggleId(ids: string[], id: string, included: boolean): string[] {
  return included ? unique([...ids, id]) : ids.filter((value) => value !== id);
}

export function setCvEntrySelected(state: CvState, model: CvModel, id: string, included: boolean): CvState {
  return reconcileCvState({ ...state, selectedEntryIds: toggleId(state.selectedEntryIds, id, included) }, model);
}

export function setCvSectionSelected(state: CvState, model: CvModel, id: string, included: boolean): CvState {
  return reconcileCvState({ ...state, selectedSectionIds: toggleId(state.selectedSectionIds, id, included) }, model);
}

function swapWithNeighbour(order: string[], groupIds: string[], id: string, direction: -1 | 1): string[] {
  const members = new Set(groupIds);
  const group = order.filter((value) => members.has(value));
  const index = group.indexOf(id);
  const neighbour = group[index + direction];
  if (index < 0 || !neighbour) return [...order];
  const next = [...order];
  const currentIndex = next.indexOf(id);
  const neighbourIndex = next.indexOf(neighbour);
  [next[currentIndex], next[neighbourIndex]] = [next[neighbourIndex], next[currentIndex]];
  return next;
}

export function moveCvEntry(state: CvState, model: CvModel, id: string, direction: -1 | 1): CvState {
  const safe = reconcileCvState(state, model);
  const group = model.sections.find((section) => section.entries.some((entry) => entry.id === id));
  if (!group) return safe;
  return { ...safe, entryOrder: swapWithNeighbour(safe.entryOrder, group.entries.map((entry) => entry.id), id, direction) };
}

export function moveCvSection(state: CvState, model: CvModel, id: string, direction: -1 | 1): CvState {
  const safe = reconcileCvState(state, model);
  return { ...safe, sectionOrder: swapWithNeighbour(safe.sectionOrder, safe.sectionOrder, id, direction) };
}
