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
      description: 'When true, the field does not open and no control accepts input.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Behavior' },
    },
    label: {
      description:
        'Names this field ("Start date", "End date") on the closed field and the open panel. Null for a lone date.',
      table: { type: { summary: 'string | null' }, category: 'State' },
    },
    dateChange: {
      description: 'Emitted when the user commits a date. Never fired by the component writing to itself.',
      table: { type: { summary: 'KnoraDate | null' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<DatePickerComponent>;

/**
 * The panel renders in the CDK overlay container, which is a sibling of the story canvas rather
 * than inside it — so everything about the panel is queried from the document, and every story
 * that inspects the panel opens it first, the way a user does.
 */
const field = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('[data-cy="date-field"]')!;
const panel = () => document.querySelector<HTMLElement>('[data-cy="date-picker-panel"]');
const open = async (canvas: HTMLElement) => {
  if (!panel()) {
    await userEvent.click(field(canvas));
  }
  return panel()!;
};

const day = (d: number) => panel()?.querySelector<HTMLElement>(`[data-cy="day-${d}"]`) ?? null;
const selected = () => panel()?.querySelector('.day-cell.is-selected')?.textContent?.trim();

export const ShowsTheGivenDate: Story = {
  name: 'Shows the date it is given, in the calendar it is told',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await open(canvasElement);
    await step('The given day is marked', async () => {
      await expect(selected()).toBe('15');
    });
    await step('The month is rendered at its real length', async () => {
      await expect(day(30)).not.toBeNull();
      await expect(day(31)).toBeNull();
    });
  },
};

export const NeverRelabelsWhenToldAnotherCalendar: Story = {
  name: 'Does not rewrite the date when the calendar changes',
  args: { date: new KnoraDate('JULIAN', 'CE', 2020, 3, 19), calendar: 'JULIAN' },
  play: async ({ canvasElement, step }) => {
    // The bug that motivated the rewrite: the old picker stamped a new calendar onto unchanged
    // numerals. This component has no code path that writes a calendar at all.
    await open(canvasElement);
    await step('The date shown is the one it was given', async () => {
      await expect(selected()).toBe('19');
    });
    await step('Its calendar is the one it was told', async () => {
      // Translated here, unlike in the jsdom spec, because Storybook loads the real locale files.
      const tag = panel()!.querySelector('[data-cy="calendar-tag"]');
      await expect(tag?.textContent?.trim()).toBe('Julian');
    });
  },
};

export const ClearsADayTheMonthCannotHold: Story = {
  name: 'Drops a day the month cannot hold rather than moving it',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 2, 31), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await open(canvasElement);
    await step('31 February is not shown as selected', async () => {
      // Derived, not stored: there is no stale day to display.
      await expect(selected()).toBeUndefined();
    });
    await step('February is still rendered at its real length', async () => {
      await expect(day(29)).not.toBeNull();
      await expect(day(30)).toBeNull();
    });
  },
};

export const MarksTheDaysTheGregorianReformSkipped: Story = {
  name: 'Offers and marks the ten days the Gregorian reform skipped',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 1582, 10, 1), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await open(canvasElement);
    // Proleptic, as in dsp-api: 5–14 October 1582 are valid Gregorian dates, so they can be picked,
    // but they never occurred where the reform took effect, so they are marked.
    await step('October 1582 has every day, the skipped ones marked', async () => {
      await expect(day(5)).not.toBeNull();
      await expect(day(5)!.classList.contains('is-reform-gap')).toBe(true);
      await expect(day(4)!.classList.contains('is-reform-gap')).toBe(false);
      await expect(day(15)!.classList.contains('is-reform-gap')).toBe(false);
    });
  },
};

export const OmitsTheEraForIslamic: Story = {
  name: 'Omits the era toggle for Islamic, which has none',
  args: { date: new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8), calendar: 'ISLAMIC' },
  play: async ({ canvasElement, step }) => {
    const opened = await open(canvasElement);
    await step('No era toggle is offered', async () => {
      await expect(opened.querySelector('[data-cy="era-toggle"]')).toBeNull();
    });
    await step('Islamic month names are used', async () => {
      await expect(opened.textContent).not.toContain('Jan');
    });
  },
};

export const PicksADay: Story = {
  name: 'Selects a day when the user clicks one',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await open(canvasElement);
    await step('Clicking the 20th selects it', async () => {
      await userEvent.click(day(20) as HTMLElement);
      await expect(selected()).toBe('20');
    });
  },
};

export const StaysClosedUntilAsked: Story = {
  name: 'Shows a field rather than an open calendar until it is clicked',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    // Two always-open panels stacked into a column and, low in a property list, ran off the
    // bottom of the screen. The field is what keeps a date value one line tall.
    await step('No calendar is on the page at rest', async () => {
      await expect(panel()).toBeNull();
    });
    await step('The field shows the date instead', async () => {
      await expect(field(canvasElement).textContent).toContain('15.06.2024');
    });
    await step('Clicking the field opens the calendar', async () => {
      await userEvent.click(field(canvasElement));
      await expect(panel()).not.toBeNull();
    });
  },
};

export const ClosesOnDone: Story = {
  name: 'Closes the calendar when the user is done',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    const opened = await open(canvasElement);
    await step('Done dismisses the panel', async () => {
      await userEvent.click(opened.querySelector('[data-cy="done-button"]') as HTMLElement);
      await expect(panel()).toBeNull();
    });
  },
};

export const NamesItselfWhenItIsOneEndOfAPeriod: Story = {
  name: 'Captions the field when it is the start or end of a period',
  args: { date: new KnoraDate('GREGORIAN', 'CE', 1580, 1, 1), calendar: 'GREGORIAN', label: 'ui.datePicker.endDate' },
  play: async ({ canvasElement, step }) => {
    await step('The field says which end it is', async () => {
      const caption = canvasElement.querySelector('[data-cy="date-field-caption"]');
      await expect(caption?.textContent?.trim()).toBe('End date');
    });
    await step('The open panel repeats it as a title', async () => {
      const opened = await open(canvasElement);
      await expect(opened.querySelector('[data-cy="panel-title"]')?.textContent?.trim()).toBe('End date');
    });
  },
};
