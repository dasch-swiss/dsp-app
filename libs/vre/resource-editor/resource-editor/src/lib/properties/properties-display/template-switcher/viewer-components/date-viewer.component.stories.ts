import { KnoraDate, KnoraPeriod, ReadDateValue } from '@dasch-swiss/dsp-js';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { Observable, of } from 'rxjs';
import { expect, userEvent } from 'storybook/test';

import { DateViewerComponent } from './date-viewer.component';

/** The marker renders through the translate pipe, so stories need the real keys or they show ids. */
const TRANSLATIONS = {
  ui: {
    calendarMarker: {
      inEachCalendar: '{{calendar}}. This date in each calendar',
      beforeHijra: 'Before the Hijra',
      calendars: { GREGORIAN: 'Gregorian', JULIAN: 'Julian', ISLAMIC: 'Islamic (tabular)' },
      jdn: 'JDN',
      periodOfDays: 'Period of {{count}} days',
      reformGapNote:
        '{{date}} lies in the ten days the Gregorian reform skipped in October 1582. It is stored as given, in the proleptic Gregorian calendar — the same day as {{julian}}.',
      machineReadable: 'ISO 8601 · EDTF',
      copy: 'Copy',
      prolepticGregorian: 'Proleptic Gregorian',
    },
    // Shared with the date picker's grid header, so they sit beside calendarMarker rather than
    // inside it.
    weekdays: {
      monday: { long: 'Monday', short: 'M' },
      tuesday: { long: 'Tuesday', short: 'T' },
      wednesday: { long: 'Wednesday', short: 'W' },
      thursday: { long: 'Thursday', short: 'T' },
      friday: { long: 'Friday', short: 'F' },
      saturday: { long: 'Saturday', short: 'S' },
      sunday: { long: 'Sunday', short: 'S' },
    },
  },
};

class StoryTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<typeof TRANSLATIONS> {
    return of(TRANSLATIONS);
  }
}

const asValue = (date: KnoraDate | KnoraPeriod): ReadDateValue => ({ date }) as unknown as ReadDateValue;

const marker = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement;
const dateText = (canvasElement: HTMLElement) => canvasElement.querySelector('[data-cy="date-text"]');
/** The popover renders in a CDK overlay, outside the story canvas. */
const popover = () => document.querySelector('[data-cy="calendar-marker-popover"]');
const readingRow = (calendar: string) => popover()?.querySelector(`[data-cy="calendar-reading-${calendar}"]`);

/** The date cell of a reading row: the popover pairs each date with its calendar name. */
const readingDate = (calendar: string) => readingRow(calendar)?.previousElementSibling?.textContent?.trim();

const meta: Meta<DateViewerComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Date Viewer',
  component: DateViewerComponent,
  decorators: [
    applicationConfig({
      providers: [provideTranslateService({ loader: { provide: TranslateLoader, useClass: StoryTranslateLoader } })],
    }),
  ],
  argTypes: {
    value: {
      description: 'ReadDateValue containing a KnoraDate or KnoraPeriod.',
      table: { type: { summary: 'ReadDateValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<DateViewerComponent>;

export const SingleDate: Story = {
  name: 'Shows a single Gregorian date with its calendar marker',
  args: {
    value: asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The date is rendered in its stored calendar', async () => {
      await expect(dateText(canvasElement)?.textContent?.trim()).toBe('15.06.2024');
    });
    await step('The marker names the stored calendar', async () => {
      const label = canvasElement.querySelector('[data-cy="calendar-marker-label"]');
      await expect(label?.textContent?.trim()).toBe('Gregorian');
    });
  },
};

export const PeriodDate: Story = {
  name: 'Shows one marker for a period, governing both ends',
  args: {
    value: asValue(
      new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2020, 1, 1), new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31))
    ),
  },
  play: async ({ canvasElement, step }) => {
    await step('Both ends are rendered', async () => {
      await expect(dateText(canvasElement)?.textContent?.trim()).toBe('01.01.2020 – 31.12.2024');
    });
    await step('Exactly one marker governs the period, because a period has one calendar', async () => {
      // This asserted two markers before DEV-7372: one per end. A period carries a single
      // calendar — CreateDateValue and UpdateDateValue have one `calendar` field for the whole
      // value — so two markers could offer a state the API cannot store.
      await expect(canvasElement.querySelectorAll('[data-cy="calendar-marker"]').length).toBe(1);
    });
  },
};

export const ReadsTheDateInEveryCalendar: Story = {
  name: 'Lists the date in every calendar at once, leaving the page unchanged',
  args: {
    value: asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
      await expect(popover()).not.toBeNull();
    });
    await step('All three calendars are listed, so they can be compared rather than cycled', async () => {
      await expect(readingDate('GREGORIAN')).toBe('15.06.2024');
      await expect(readingDate('JULIAN')).toBe('02.06.2024');
      await expect(readingDate('ISLAMIC')).toBe('08.12.1445');
    });
    await step('The stored calendar is marked, so a citation stays honest', async () => {
      await expect(readingRow('GREGORIAN')?.classList.contains('is-stored')).toBe(true);
      await expect(readingRow('JULIAN')?.classList.contains('is-stored')).toBe(false);
    });
    await step('The date on the page is still the stored one', async () => {
      // This story replaced `ConvertsToAnotherCalendar`, which asserted the page text became
      // `02.06.2024`. Re-rendering the value in a chosen calendar means reading one at a time and
      // leaves a reader unsure which they are looking at; the page now always shows the source.
      await expect(dateText(canvasElement)?.textContent?.trim()).toBe('15.06.2024');
    });
  },
};

export const YearPrecisionRendersASpan: Story = {
  name: 'Shows the span a year-precision date covers in another calendar',
  args: {
    // Julian 1582 runs into Gregorian 1583, so naming one year would assert a precision the
    // source never had.
    value: asValue(new KnoraDate('JULIAN', 'CE', 1582)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The stored year stands alone on the page', async () => {
      await expect(dateText(canvasElement)?.textContent?.trim()).toBe('1582');
    });
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
    });
    await step('The Gregorian reading names both years it covers', async () => {
      await expect(readingDate('GREGORIAN')).toBe('1582/1583');
    });
  },
};

export const StatesThatACalendarCannotExpressTheDate: Story = {
  name: 'Says a pre-Hijra date has no Islamic form rather than omitting it',
  args: {
    value: asValue(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
    });
    await step('Islamic is listed with no date, because the date precedes the Hijra', async () => {
      // The earlier version disabled an Islamic menu option. Dropping or greying the row leaves a
      // reader unsure whether the calendar was forgotten; saying so in words answers the question.
      await expect(readingDate('ISLAMIC')).toBe('Before the Hijra');
    });
    await step('The calendars that can express it still show a date', async () => {
      await expect(readingDate('JULIAN')).toMatch(/\d{2}\.\d{2}\.\d{3}/);
    });
  },
};

export const NotesADayTheGregorianReformSkipped: Story = {
  name: 'Notes that a stored day lies in the days the Gregorian reform skipped',
  args: {
    value: asValue(new KnoraDate('GREGORIAN', 'CE', 1582, 10, 5)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
    });
    // A valid proleptic date, stored as given — but one that never occurred where the reform took
    // effect, so the panel says so and names the Julian day it is.
    await step('The panel names the skipped day and its Julian equivalent', async () => {
      const note = document.querySelector('[data-cy="calendar-marker-reform-gap"]');
      await expect(note?.textContent).toContain('the Gregorian reform skipped');
      await expect(note?.textContent).toContain('25.09.1582 Julian');
    });
  },
};

export const GivesTheDateAsIsoAndEdtf: Story = {
  name: 'Gives the date as ISO 8601 · EDTF, the exact Gregorian days a Julian year covers',
  args: {
    value: asValue(new KnoraDate('JULIAN', 'CE', 1582)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
    });
    // A Julian year is no Gregorian year, so the value is its exact days, in Gregorian.
    await step('The value is the interval of days, marked as proleptic Gregorian', async () => {
      await expect(document.querySelector('[data-cy="calendar-marker-iso"]')?.textContent).toBe(
        '1582-01-11/1583-01-10'
      );
      await expect(document.querySelector('[data-cy="calendar-marker-iso-note"]')?.textContent).toContain(
        'Proleptic Gregorian'
      );
    });
  },
};

export const ClosesOnEscape: Story = {
  name: 'Closes the popover on Escape',
  args: {
    value: asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(marker(canvasElement));
      await expect(popover()).not.toBeNull();
    });
    await step('Escape dismisses it without touching the value', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(popover()).toBeNull();
      await expect(dateText(canvasElement)?.textContent?.trim()).toBe('15.06.2024');
    });
  },
};

export const OpensClosed: Story = {
  name: 'Renders with the popover closed',
  args: {
    value: asValue(new KnoraDate('JULIAN', 'CE', 1582, 10, 5)),
  },
  play: async ({ canvasElement, step }) => {
    // REQ-1.12: a viewer rebuilt for a different value must not inherit an open popover from the
    // one before it. Property rows are recycled as a resource is navigated, and an overlay left
    // open would then be attached to a date it was never opened for.
    await step('Nothing is open until the reader asks', async () => {
      await expect(popover()).toBeNull();
    });
    await step('The stored date is on the page regardless', async () => {
      await expect(dateText(canvasElement)?.textContent?.trim()).toBe('05.10.1582');
    });
    await step('Opening and closing leaves no overlay behind', async () => {
      await userEvent.click(marker(canvasElement));
      await expect(popover()).not.toBeNull();
      await userEvent.keyboard('{Escape}');
      await expect(popover()).toBeNull();
    });
  },
};

const factsRow = (hook: string) => document.querySelector(`[data-cy="calendar-marker-${hook}"]`);

export const StatesTheWeekdayAndDayNumber: Story = {
  name: 'States the weekday and Julian Day Number of a single day',
  args: { value: asValue(new KnoraDate('JULIAN', 'BCE', 100, 9, 20)) },
  play: async ({ canvasElement, step }) => {
    await userEvent.click(marker(canvasElement));

    // One instant has one weekday and one day number whatever calendar names it, so they are
    // stated once below the readings rather than repeated on each row.
    await step('The weekday is named on its own line', async () => {
      await expect(factsRow('weekday')?.textContent?.trim()).toBe('Wednesday');
    });
    // The number sits in the left column and "JDN" in the right, so it lines up with the dates
    // above it and reads as a unit rather than a prefix.
    await step('And the day number given, labelled like a calendar', async () => {
      await expect(factsRow('jdn')?.textContent?.trim()).toBe('1685161');
    });
    await step('Once, not per calendar', async () => {
      await expect(document.querySelectorAll('[data-cy="calendar-marker-weekday"]').length).toBe(1);
    });
  },
};

export const StatesHowLongAPeriodRan: Story = {
  name: 'States how many days a period covers',
  args: {
    value: asValue(
      new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1), new KnoraDate('GREGORIAN', 'CE', 2024, 1, 12))
    ),
  },
  play: async ({ canvasElement, step }) => {
    await userEvent.click(marker(canvasElement));

    // Counted inclusively, as a span is spoken about: 1-12 January is twelve days, not eleven.
    await step('The duration is counted inclusively, on a line of its own', async () => {
      await expect(factsRow('duration')?.textContent?.trim()).toBe('Period of 12 days');
    });
    await step('The day numbers read as a range', async () => {
      await expect(factsRow('jdn')?.textContent?.trim()).toBe('2460311–2460322');
    });
    // Both ends, because the pair is what says this is a period.
    await step('And both weekdays are named', async () => {
      await expect(factsRow('weekday')?.textContent?.trim()).toBe('Monday–Friday');
    });
  },
};

export const SaysNothingItCannotKnow: Story = {
  name: 'Omits the weekday and day number for a date that names no single day',
  args: { value: asValue(new KnoraDate('JULIAN', 'CE', 1582)) },
  play: async ({ canvasElement, step }) => {
    await userEvent.click(marker(canvasElement));

    // A year covers 365 days, so it has no weekday and no one day number. Showing the first day's
    // would assert a precision the source never had.
    await step('No weekday and no day number appear', async () => {
      await expect(factsRow('weekday')).toBeNull();
      await expect(factsRow('jdn')).toBeNull();
    });
    // The machine-readable value states the year's exact days instead, as an interval.
    await step('The machine-readable value is still given', async () => {
      await expect(factsRow('iso')).not.toBeNull();
    });
    await step('While the readings are still listed', async () => {
      await expect(document.querySelector('[data-cy="calendar-marker-popover"]')).not.toBeNull();
    });
  },
};
