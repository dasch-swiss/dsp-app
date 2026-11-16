import { RouteConstants } from '@dasch-swiss/vre/core/config';

/** Where the Data models 2 tab keeps, in this browser, the section last opened. */
const LAST_SECTION_KEY = 'dsp-data-models-2-section';

/** The sections the tab opens on: the data model's own, then the project's lists. */
const SECTIONS: readonly string[] = [
  RouteConstants.classes,
  RouteConstants.properties,
  RouteConstants.graph,
  RouteConstants.lists,
];

/**
 * The section the Data models 2 tab opens on: the one last opened in this browser, or Resource classes the first time,
 * as that list of classes is what people know from the Data models tab.
 */
export function lastDataModelsSection(): string {
  try {
    const stored = localStorage.getItem(LAST_SECTION_KEY);
    if (stored && SECTIONS.includes(stored)) return stored;
  } catch {
    // Not readable, as in a private window; the first time's section then.
  }
  return RouteConstants.classes;
}

/** Remembers the section opened, for the tab to open on it next time. */
export function rememberDataModelsSection(section: string): void {
  if (!SECTIONS.includes(section)) return;
  try {
    localStorage.setItem(LAST_SECTION_KEY, section);
  } catch {
    // Not remembered; the tab opens on Resource classes next time.
  }
}
