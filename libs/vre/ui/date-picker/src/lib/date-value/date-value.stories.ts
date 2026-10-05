import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent } from 'storybook/test';

import { DateValueComponent } from './date-value.component';

/**
 * Driven through a `formControl`, as the resource editor does, and asserted in a real browser.
 *
 * Both matter. Every fix for the relabelling defect passed in jsdom and failed in Chrome, and every
 * test that missed it drove the component directly rather than through a form control.
 */
@Component({
  selector: 'app-date-value-story-host',
  imports: [DateValueComponent, ReactiveFormsModule],
  template: `
    <app-date-value [formControl]="control" />
    <pre data-cy="control-value">{{ asText() }}</pre>
  `,
})
class DateValueStoryHost implements OnInit {
  readonly control = new FormControl<KnoraDate | KnoraPeriod | null>(null);
  initial: KnoraDate | KnoraPeriod | null = null;

  ngOnInit() {
    // Arrives after first render, as the resource does.
    queueMicrotask(() => this.control.setValue(this.initial));
  }

  asText(): string {
    const v = this.control.value;
    if (v === null) return 'null';
    if (v instanceof KnoraPeriod) return `${this.one(v.start)} – ${this.one(v.end)}`;
    return this.one(v);
  }

  private one(d: KnoraDate): string {
    return `${d.day ?? '-'}.${d.month ?? '-'}.${d.year} ${d.calendar}`;
  }
}

const meta: Meta<DateValueStoryHost> = {
  title: 'UI / Date Picker / Date Value',
  component: DateValueStoryHost,
  decorators: [moduleMetadata({ imports: [DateValueComponent, ReactiveFormsModule] })],
};
export default meta;
type Story = StoryObj<DateValueStoryHost>;

const controlValue = (canvas: HTMLElement) => canvas.querySelector('[data-cy="control-value"]')?.textContent?.trim();
const calendarOption = (canvas: HTMLElement, cal: string) =>
  canvas.querySelector<HTMLElement>(`[data-cy="calendar-option-${cal}"]`);

export const ConvertsRatherThanRelabels: Story = {
  name: 'Converts a stored date instead of relabelling it',
  args: { initial: new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1) },
  play: async ({ canvasElement, step }) => {
    await step('The stored date is shown', async () => {
      await expect(controlValue(canvasElement)).toBe('1.4.2020 GREGORIAN');
    });
    await step('Switching to Julian converts it — 19.03, not 01.04 relabelled', async () => {
      await userEvent.click(calendarOption(canvasElement, 'JULIAN') as HTMLElement);
      await expect(controlValue(canvasElement)).toBe('19.3.2020 JULIAN');
    });
    await step('Switching back returns exactly the stored date', async () => {
      await userEvent.click(calendarOption(canvasElement, 'GREGORIAN') as HTMLElement);
      await expect(controlValue(canvasElement)).toBe('1.4.2020 GREGORIAN');
    });
  },
};

export const RoundTripsThroughIslamic: Story = {
  name: 'Round-trips through Islamic without drift',
  args: { initial: new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1) },
  play: async ({ canvasElement, step }) => {
    await step('Islamic shows the converted date', async () => {
      await userEvent.click(calendarOption(canvasElement, 'ISLAMIC') as HTMLElement);
      await expect(controlValue(canvasElement)).toBe('7.8.1441 ISLAMIC');
    });
    await step('And back is the stored date, not a conversion of a conversion', async () => {
      await userEvent.click(calendarOption(canvasElement, 'GREGORIAN') as HTMLElement);
      await expect(controlValue(canvasElement)).toBe('1.4.2020 GREGORIAN');
    });
  },
};

export const ShowsBothDatesAndTheSameDayAfterASwitch: Story = {
  name: 'Shows the stored and the converted date, and that it is the same day, after a switch',
  args: { initial: new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1) },
  play: async ({ canvasElement, step }) => {
    await step('Switching the calendar', async () => {
      await userEvent.click(calendarOption(canvasElement, 'JULIAN') as HTMLElement);
    });

    // The one thing the numerals cannot show: 01.04.2020 Gregorian and 19.03.2020 Julian are the
    // same day. One hint says what the stored value became, and that the day is unchanged.
    await step('The hint names both dates, says it is the same day, and names the calendar', async () => {
      const hint = canvasElement.querySelector('[data-cy="converted-from"]');
      await expect(hint?.textContent).toContain(
        '19.03.2020 Julian has been converted from 01.04.2020 Gregorian (stored value): same day, simply expressed in Julian.'
      );
    });
  },
};

export const ShowsNoHintWhenTheUserPicksAnotherDay: Story = {
  name: 'Shows no hint once the user picks a different day in the stored calendar',
  args: { initial: new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1) },
  play: async ({ canvasElement, step }) => {
    await step('Picking a different day', async () => {
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-cy="date-field"]')!);
      await userEvent.click(document.querySelector<HTMLElement>('[data-cy="day-9"]')!);
    });

    // A user who has just chosen a different date can see that it differs; saying so read as a
    // warning about something they did on purpose.
    await step('No hint appears', async () => {
      await expect(canvasElement.querySelector('[data-cy="converted-from"]')).toBeNull();
    });
  },
};

export const KeepsTheYearsOfAPeriod: Story = {
  name: 'Keeps the years of a year-precision period between Julian and Gregorian',
  args: {
    initial: new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)),
  },
  play: async ({ canvasElement, step }) => {
    await step('Julian 1580–1585 becomes Gregorian 1580–1585', async () => {
      // Someone who entered years means those years, not the span of days they cover.
      await userEvent.click(calendarOption(canvasElement, 'GREGORIAN') as HTMLElement);
      await expect(controlValue(canvasElement)).toBe('-.-.1580 GREGORIAN – -.-.1585 GREGORIAN');
    });
    await step('And back is exactly the stored period', async () => {
      await userEvent.click(calendarOption(canvasElement, 'JULIAN') as HTMLElement);
      await expect(controlValue(canvasElement)).toBe('-.-.1580 JULIAN – -.-.1585 JULIAN');
    });
  },
};

export const OffersOneCalendarForAPeriod: Story = {
  name: 'Offers one calendar control for a whole period',
  args: {
    initial: new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)),
  },
  play: async ({ canvasElement, step }) => {
    await step('A period carries one calendar, so it gets one control', async () => {
      await expect(canvasElement.querySelectorAll('app-calendar-selector').length).toBe(1);
    });
    // One control is the whole statement. Spelling it out in a caption under the control told the
    // user something the single control already shows.
    await step('Without a caption explaining it', async () => {
      await expect(canvasElement.querySelector('[data-cy="calendar-caption"]')).toBeNull();
    });
  },
};

export const KeepsAPeriodOnOneLine: Story = {
  name: 'Puts the start and end of a period side by side, both closed',
  args: {
    initial: new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)),
  },
  play: async ({ canvasElement, step }) => {
    // The reported bug: both pickers rendered their calendar inline, so a period was two stacked
    // grids, and the lower one was cut off wherever the page ran out of room.
    await step('Neither end is showing a calendar', async () => {
      await expect(document.querySelectorAll('[data-cy="date-picker-panel"]').length).toBe(0);
    });
    await step('Both ends are fields on the same line', async () => {
      const fields = canvasElement.querySelectorAll<HTMLElement>('[data-cy="date-field"]');
      await expect(fields.length).toBe(2);
      await expect(fields[0].getBoundingClientRect().top).toBe(fields[1].getBoundingClientRect().top);
    });
    await step('Opening one end shows exactly one calendar', async () => {
      await userEvent.click(canvasElement.querySelectorAll<HTMLElement>('[data-cy="date-field"]')[0]);
      await expect(document.querySelectorAll('[data-cy="date-picker-panel"]').length).toBe(1);
    });
  },
};

export const OpensANewValueOnAUsableMonth: Story = {
  name: 'Opens a new value on a month that can be clicked',
  args: { initial: null },
  play: async ({ canvasElement, step }) => {
    // The reported bug: a new value had no year, so the panel opened with no month and no grid —
    // nothing to click, and no hint that a year had to be typed first.
    const field = canvasElement.querySelector<HTMLElement>('[data-cy="date-field"]')!;
    await userEvent.click(field);

    await step('A day grid is there to click', async () => {
      const days = document.querySelectorAll('[data-cy^="day-"]');
      await expect(days.length).toBeGreaterThan(0);
    });
    await step('But nothing has been chosen yet', async () => {
      await expect(document.querySelector('.day-cell.is-selected')).toBeNull();
      await expect(field.querySelector('.is-placeholder')).not.toBeNull();
    });
    await step('So the value is still empty', async () => {
      await expect(controlValue(canvasElement)).toBe('null');
    });

    // The controls name the month the grid offers, so the panel says what it is showing — but it
    // is shown, not entered, until the user builds on it.
    await step('The controls show the current year and month', async () => {
      const month = document.querySelector<HTMLSelectElement>('[data-cy="month-select"]');
      const year = document.querySelector<HTMLInputElement>('[data-cy="year-input"]');
      await expect(month?.value).toBe(String(new Date().getMonth() + 1));
      await expect(year?.value).toBe(String(new Date().getFullYear()));
    });

    // Switching the era enters nothing, so nothing may be stored.
    await step('Switching the era alone still stores nothing', async () => {
      await userEvent.click(document.querySelector<HTMLElement>('[data-cy="era-BCE"]')!);
      await expect(controlValue(canvasElement)).toBe('null');
    });
  },
};

export const ConvertsAValueThatIsNotStoredYet: Story = {
  name: 'Converts a newly entered date when the calendar changes',
  args: { initial: null },
  play: async ({ canvasElement, step }) => {
    // Entering a date the way a user does, on a value that has never been saved.
    await step('Enter a date', async () => {
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-cy="date-field"]')!);
      await userEvent.click(document.querySelector<HTMLElement>('[data-cy="day-3"]')!);
      await userEvent.click(document.querySelector<HTMLElement>('[data-cy="done-button"]')!);
    });

    // The reported bug: the value underneath converted but the field kept showing the date from
    // before the switch, so the form disagreed with itself about what was about to be saved.
    await step('Switching the calendar converts what the field shows', async () => {
      await userEvent.click(calendarOption(canvasElement, 'JULIAN') as HTMLElement);

      const field = canvasElement.querySelector<HTMLElement>('[data-cy="date-field-value"]');
      await expect(field?.textContent?.trim()).not.toBe('');
      await expect(controlValue(canvasElement)).toContain('JULIAN');
    });

    await step('And the field agrees with the value', async () => {
      const field = canvasElement.querySelector<HTMLElement>('[data-cy="date-field-value"]')!;
      const shown = field.textContent!.trim();
      const [day, month] = shown.split('.');
      await expect(controlValue(canvasElement)).toContain(`${Number(day)}.${Number(month)}.`);
    });
  },
};
