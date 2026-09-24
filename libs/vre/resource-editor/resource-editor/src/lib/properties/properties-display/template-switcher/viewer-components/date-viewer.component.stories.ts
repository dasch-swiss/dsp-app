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
      storedAs: 'stored as {{calendar}}',
      calendars: { GREGORIAN: 'Gregorian', JULIAN: 'Julian', ISLAMIC: 'Islamic' },
    },
  },
};

class StoryTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<typeof TRANSLATIONS> {
    return of(TRANSLATIONS);
  }
}

const asValue = (date: KnoraDate | KnoraPeriod): ReadDateValue => ({ date }) as unknown as ReadDateValue;

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
      const text = canvasElement.querySelector('[data-cy="date-text"]');
      await expect(text?.textContent?.trim()).toBe('15.06.2024');
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
      const text = canvasElement.querySelector('[data-cy="date-text"]');
      await expect(text?.textContent?.trim()).toBe('01.01.2020 - 31.12.2024');
    });
    await step('Exactly one marker governs the period, because a period has one calendar', async () => {
      // This asserted two markers before DEV-7372: one per end. A period carries a single
      // calendar — CreateDateValue and UpdateDateValue have one `calendar` field for the whole
      // value — so two markers could offer a state the API cannot store.
      await expect(canvasElement.querySelectorAll('[data-cy="calendar-marker"]').length).toBe(1);
    });
  },
};

export const ConvertsToAnotherCalendar: Story = {
  name: 'Re-renders the date when the reader picks another calendar',
  args: {
    value: asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader switches the marker to Julian', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement);
      await userEvent.click(document.querySelector('[data-cy="calendar-option-JULIAN"]') as HTMLElement);
    });
    await step('The same day is now shown in the Julian calendar', async () => {
      const text = canvasElement.querySelector('[data-cy="date-text"]');
      await expect(text?.textContent?.trim()).toBe('02.06.2024');
    });
    await step('The stored calendar stays visible, so a citation stays honest', async () => {
      const stored = canvasElement.querySelector('[data-cy="calendar-marker-stored"]');
      await expect(stored?.textContent).toContain('Gregorian');
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
    await step('At rest the stored year stands alone', async () => {
      const text = canvasElement.querySelector('[data-cy="date-text"]');
      await expect(text?.textContent?.trim()).toBe('1582');
    });
    await step('The reader switches to Gregorian', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement);
      await userEvent.click(document.querySelector('[data-cy="calendar-option-GREGORIAN"]') as HTMLElement);
    });
    await step('Both years it covers are shown', async () => {
      const text = canvasElement.querySelector('[data-cy="date-text"]');
      await expect(text?.textContent?.trim()).toBe('1582/1583');
    });
  },
};

export const WithholdsAnUnrepresentableCalendar: Story = {
  name: 'Does not offer the Islamic calendar for a pre-Hijra date',
  args: {
    value: asValue(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1)),
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement);
    });
    await step('Islamic cannot be chosen, because the date precedes the Hijra', async () => {
      const islamic = document.querySelector('[data-cy="calendar-option-ISLAMIC"]') as HTMLButtonElement;
      await expect(islamic.disabled).toBe(true);
    });
  },
};
