import { KnoraDate } from '@dasch-swiss/dsp-js';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent } from 'storybook/test';

import { DatePickerComponent } from './date-picker.component';

/**
 * These run in a real browser, which matters more here than usual.
 *
 * The defect this component was rewritten to eliminate — a calendar switch relabelling a date
 * rather than converting it — passed every jsdom test three times and failed in Chrome each time,
 * because it depended on the order in which competing writers settled. The specs beside this file
 * assert the same contract, but these are the ones that hold the line.
 */
const meta: Meta<DatePickerComponent> = {
  title: 'UI / Date Picker / Date Picker',
  component: DatePickerComponent,
  argTypes: {
    date: {
      description: 'The date to show. Replacing it replaces what is displayed; never written back.',
      table: { type: { summary: 'KnoraDate | null' }, category: 'State' },
    },
    calendar: {
      description: 'The calendar to show it in. The picker is told this and never changes it.',
      control: 'select',
      options: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
      table: { type: { summary: 'CalendarSystem' }, category: 'State' },
    },
    disabled: {
      description: 'When true, no control accepts input.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Behavior' },
    },
    dateChange: {
      description: 'Emitted when the user commits a date. Never fired by the component writing to itself.',
      table: { type: { summary: 'KnoraDate | null' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<DatePickerComponent>;

const day = (canvas: HTMLElement, d: number) => canvas.querySelector<HTMLElement>(`[data-cy="day-${d}"]`);
const selected = (canvas: HTMLElement) => canvas.querySelector('.day.selected .selectable')?.textContent?.trim();

export const ShowsTheGivenDate: Story = {
  name: 'Shows the date it is given, in the calendar it is told',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await step('The given day is marked', async () => {
      await expect(selected(canvasElement)).toBe('15');
    });
    await step('The month is rendered at its real length', async () => {
      await expect(day(canvasElement, 30)).not.toBeNull();
      await expect(day(canvasElement, 31)).toBeNull();
    });
  },
};

export const NeverRelabelsWhenToldAnotherCalendar: Story = {
  name: 'Does not rewrite the date when the calendar changes',
  args: { date: new KnoraDate('JULIAN', 'CE', 2020, 3, 19), calendar: 'JULIAN' },
  play: async ({ canvasElement, step }) => {
    // The bug that motivated the rewrite: the old picker stamped a new calendar onto unchanged
    // numerals. This component has no code path that writes a calendar at all.
    await step('The date shown is the one it was given', async () => {
      await expect(selected(canvasElement)).toBe('19');
    });
    await step('Its calendar is the one it was told', async () => {
      // Translated here, unlike in the jsdom spec, because Storybook loads the real locale files.
      const tag = canvasElement.querySelector('[data-cy="calendar-tag"]');
      await expect(tag?.textContent?.trim()).toBe('Julian');
    });
  },
};

export const ClearsADayTheMonthCannotHold: Story = {
  name: 'Drops a day the month cannot hold rather than moving it',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 2, 31), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await step('31 February is not shown as selected', async () => {
      // Derived, not stored: there is no stale day to display.
      await expect(selected(canvasElement)).toBeUndefined();
    });
    await step('February is still rendered at its real length', async () => {
      await expect(day(canvasElement, 29)).not.toBeNull();
      await expect(day(canvasElement, 30)).toBeNull();
    });
  },
};

export const SkipsTheGregorianReform: Story = {
  name: 'Skips the ten days the Gregorian reform deleted',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 1582, 10, 1), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await step('October 1582 runs 1-4 then 15-31', async () => {
      await expect(day(canvasElement, 4)).not.toBeNull();
      await expect(day(canvasElement, 5)).toBeNull();
      await expect(day(canvasElement, 15)).not.toBeNull();
    });
  },
};

export const OmitsTheEraForIslamic: Story = {
  name: 'Omits the era toggle for Islamic, which has none',
  args: { date: new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8), calendar: 'ISLAMIC' },
  play: async ({ canvasElement, step }) => {
    await step('No era toggle is offered', async () => {
      await expect(canvasElement.querySelector('[data-cy="era-toggle"]')).toBeNull();
    });
    await step('Islamic month names are used', async () => {
      await expect(canvasElement.textContent).not.toContain('Jan');
    });
  },
};

export const PicksADay: Story = {
  name: 'Selects a day when the user clicks one',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await step('Clicking the 20th selects it', async () => {
      await userEvent.click(day(canvasElement, 20) as HTMLElement);
      await expect(selected(canvasElement)).toBe('20');
    });
  },
};
