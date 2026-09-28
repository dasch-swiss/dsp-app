import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { Observable, of } from 'rxjs';
import { expect, userEvent } from 'storybook/test';

import { CalendarMarkerComponent } from './calendar-marker.component';

/** The marker renders through the translate pipe, so stories need the real keys or they show ids. */
const TRANSLATIONS = {
  ui: {
    calendarMarker: {
      inEachCalendar: 'Stored in the {{calendar}} calendar. Show this date in every calendar.',
      beforeHijra: 'Before the Hijra',
      calendars: { GREGORIAN: 'Gregorian', JULIAN: 'Julian', ISLAMIC: 'Islamic' },
    },
  },
};

class StoryTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<typeof TRANSLATIONS> {
    return of(TRANSLATIONS);
  }
}

/** A Julian date read in all three calendars, as the owner would hand it over. */
const JULIAN_READINGS = [
  { calendar: 'GREGORIAN' as const, date: '15.06.2024' },
  { calendar: 'JULIAN' as const, date: '02.06.2024' },
  { calendar: 'ISLAMIC' as const, date: '08.12.1445' },
];

const marker = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement;
/** The popover renders in a CDK overlay, outside the story canvas. */
const popover = () => document.querySelector('[data-cy="calendar-marker-popover"]');
const readingRow = (calendar: string) => popover()?.querySelector(`[data-cy="calendar-reading-${calendar}"]`);
/** The date cell of a reading row: the popover pairs each date with its calendar name. */
const readingDate = (calendar: string) => readingRow(calendar)?.previousElementSibling?.textContent?.trim();

const meta: Meta<CalendarMarkerComponent> = {
  title: 'UI / Calendar Marker',
  component: CalendarMarkerComponent,
  decorators: [
    applicationConfig({
      providers: [provideTranslateService({ loader: { provide: TranslateLoader, useClass: StoryTranslateLoader } })],
    }),
  ],
  argTypes: {
    storedCalendar: {
      description: 'The calendar the value is stored in. Named at rest, and listed first and bold when open.',
      control: 'select',
      options: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
      table: { type: { summary: 'CalendarSystem' }, category: 'State' },
    },
    readings: {
      description:
        'This date read in every calendar. A reading with no `date` is one the calendar cannot express, and is listed as such rather than dropped.',
      control: 'object',
      table: { type: { summary: 'readonly CalendarReading[]' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<CalendarMarkerComponent>;

export const StatesTheStoredCalendarAtRest: Story = {
  name: 'States the stored calendar without any interaction',
  args: {
    storedCalendar: 'JULIAN',
    readings: JULIAN_READINGS,
  },
  play: async ({ canvasElement, step }) => {
    await step('The stored calendar is named on the face of the control', async () => {
      const label = canvasElement.querySelector('[data-cy="calendar-marker-label"]');
      await expect(label?.textContent?.trim()).toBe('Julian');
    });
    await step('Nothing is open until the reader asks', async () => {
      await expect(popover()).toBeNull();
      await expect(marker(canvasElement).getAttribute('aria-expanded')).toBe('false');
    });
  },
};

export const ListsEveryCalendarAtOnce: Story = {
  name: 'Lists the date in all three calendars, stored one first and bold',
  args: {
    storedCalendar: 'JULIAN',
    readings: JULIAN_READINGS,
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
      await expect(popover()).not.toBeNull();
    });
    await step('Each calendar is listed with its own reading of the date', async () => {
      await expect(readingDate('JULIAN')).toBe('02.06.2024');
      await expect(readingDate('GREGORIAN')).toBe('15.06.2024');
      await expect(readingDate('ISLAMIC')).toBe('08.12.1445');
    });
    await step('The stored calendar comes first, because it is the one being cited', async () => {
      const names = Array.from(popover()?.querySelectorAll('.calendar-marker-name') ?? []).map(n =>
        n.textContent?.trim()
      );
      await expect(names[0]).toBe('Julian');
    });
    await step('The stored reading is the one marked, so it is distinguishable at a glance', async () => {
      await expect(readingRow('JULIAN')?.classList.contains('is-stored')).toBe(true);
      await expect(readingRow('GREGORIAN')?.classList.contains('is-stored')).toBe(false);
    });
  },
};

export const StatesACalendarThatCannotExpressTheDate: Story = {
  name: 'Says a calendar has no form for the date rather than hiding it',
  args: {
    storedCalendar: 'JULIAN',
    // A pre-Hijra date has no Islamic form, so the owner supplies no date for it.
    readings: [
      { calendar: 'GREGORIAN', date: '03.01.500' },
      { calendar: 'JULIAN', date: '01.01.500' },
      { calendar: 'ISLAMIC' },
    ],
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
    });
    await step('Islamic is listed, and says why it has no date', async () => {
      // Dropping the row would leave a reader unsure whether the calendar was forgotten or does
      // not apply; saying so in words answers that without them having to know the Hijra.
      await expect(readingRow('ISLAMIC')).not.toBeNull();
      await expect(readingDate('ISLAMIC')).toBe('Before the Hijra');
    });
    await step('The calendars that can express it still show a date', async () => {
      await expect(readingDate('GREGORIAN')).toBe('03.01.500');
    });
  },
};

export const OperatesByKeyboardAlone: Story = {
  name: 'Can be opened and dismissed without a mouse',
  args: {
    storedCalendar: 'JULIAN',
    readings: JULIAN_READINGS,
  },
  play: async ({ canvasElement, step }) => {
    // The repo has no automated accessibility lint, so this story is what catches a regression.
    await step('The marker takes focus by tabbing', async () => {
      await userEvent.tab();
      await expect(marker(canvasElement)).toHaveFocus();
    });
    await step('Enter opens the readings', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(popover()).not.toBeNull();
      await expect(readingDate('GREGORIAN')).toBe('15.06.2024');
    });
    await step('Escape dismisses it', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(popover()).toBeNull();
    });
  },
};

export const NamesItsPurposeToAssistiveTechnology: Story = {
  name: 'Tells a screen reader which calendar is stored and what opening does',
  args: {
    storedCalendar: 'ISLAMIC',
    readings: JULIAN_READINGS,
  },
  play: async ({ canvasElement, step }) => {
    await step('The accessible name states the stored calendar and the action', async () => {
      // A bare "Islamic" would read as a label; the name has to say that activating it does
      // something, since the visible dotted underline conveys that only to sighted readers.
      await expect(marker(canvasElement).getAttribute('aria-label')).toBe(
        'Stored in the Islamic calendar. Show this date in every calendar.'
      );
    });
    await step('Opening state is exposed, not only drawn', async () => {
      await expect(marker(canvasElement).getAttribute('aria-expanded')).toBe('false');
      await userEvent.click(marker(canvasElement));
      await expect(marker(canvasElement).getAttribute('aria-expanded')).toBe('true');
    });
    await step('The panel is announced as a dialog carrying the same name', async () => {
      await expect(popover()?.getAttribute('role')).toBe('dialog');
      await expect(popover()?.getAttribute('aria-label')).toContain('Islamic');
    });
  },
};
