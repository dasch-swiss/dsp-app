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
  canvas.querySelector<HTMLElement>(`[data-cy="calendar-option-${cal}"] button`);

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

export const SaysNothingToSaveAfterASwitch: Story = {
  name: 'Says a calendar switch alone changes nothing',
  args: { initial: new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1) },
  play: async ({ canvasElement, step }) => {
    await step('Switching the calendar', async () => {
      await userEvent.click(calendarOption(canvasElement, 'JULIAN') as HTMLElement);
    });
    await step('The status line agrees with the save gate', async () => {
      const status = canvasElement.querySelector('[data-cy="save-status"]');
      await expect(status?.textContent).toContain('Nothing to save');
    });
    await step('And names the stored value as what it converted from', async () => {
      const note = canvasElement.querySelector('[data-cy="converted-from"]');
      await expect(note?.textContent).toContain('Stored value');
    });
  },
};

export const DoesNotShrinkAPeriod: Story = {
  name: 'Converts a period without shrinking it',
  args: {
    initial: new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)),
  },
  play: async ({ canvasElement, step }) => {
    await step('Julian 1580–1585 covers Gregorian 1580–1586', async () => {
      // The end takes the last day of its span; taking the first would drop a year of a value that
      // is saved rather than merely displayed.
      await userEvent.click(calendarOption(canvasElement, 'GREGORIAN') as HTMLElement);
      await expect(controlValue(canvasElement)).toBe('-.-.1580 GREGORIAN – -.-.1586 GREGORIAN');
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
    await step('And says so', async () => {
      const caption = canvasElement.querySelector('[data-cy="calendar-caption"]');
      await expect(caption?.textContent).toContain('whole value');
    });
  },
};
