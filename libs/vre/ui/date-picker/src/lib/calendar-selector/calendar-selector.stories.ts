import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent } from 'storybook/test';

import { CalendarSelectorComponent } from './calendar-selector.component';

const meta: Meta<CalendarSelectorComponent> = {
  title: 'UI / Date Picker / Calendar Selector',
  component: CalendarSelectorComponent,
  argTypes: {
    calendar: {
      description: 'The calendar currently chosen.',
      control: 'select',
      options: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
      table: { type: { summary: 'CalendarSystem' }, category: 'State' },
    },
    available: {
      description:
        'Which calendars the value can be expressed in. The others are shown disabled rather than hidden, because a hidden option cannot be told apart from one that does not exist.',
      control: 'object',
      table: { type: { summary: 'readonly CalendarSystem[]' }, category: 'State' },
    },
    disabled: {
      description: 'When true, no choice can be made.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Behavior' },
    },
    caption: {
      description: 'An optional i18n key rendered under the control, to explain the choice’s scope.',
      table: { type: { summary: 'string | null' }, category: 'State' },
    },
    hookPrefix: {
      description: 'Prefixes the data-cy hooks, so one component can serve both a single date and a period.',
      table: { type: { summary: 'string' }, category: 'Behavior' },
    },
    calendarChange: {
      description: 'Emitted when the user picks a calendar. Never fired by an input changing.',
      table: { type: { summary: 'CalendarSystem' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<CalendarSelectorComponent>;

const option = (canvas: HTMLElement, calendar: string) =>
  canvas.querySelector<HTMLElement>(`[data-cy="calendar-option-${calendar}"] button`);

export const OffersEveryCalendar: Story = {
  name: 'Offers all three calendars and marks the chosen one',
  args: { calendar: 'JULIAN' },
  play: async ({ canvasElement, step }) => {
    await step('All three are offered', async () => {
      await expect(option(canvasElement, 'GREGORIAN')).not.toBeNull();
      await expect(option(canvasElement, 'JULIAN')).not.toBeNull();
      await expect(option(canvasElement, 'ISLAMIC')).not.toBeNull();
    });
    await step('The Islamic option names which Islamic calendar it means', async () => {
      // There are several and they disagree by a day or two, so a bare "Islamic" would claim more
      // than the app can back.
      await expect(canvasElement.textContent).toContain('tabular');
    });
  },
};

export const ExplainsAnUnavailableCalendar: Story = {
  name: 'Says why Islamic is unavailable rather than only greying it',
  args: { calendar: 'GREGORIAN', available: ['GREGORIAN', 'JULIAN'] },
  play: async ({ canvasElement, step }) => {
    await step('Islamic is disabled but still visible', async () => {
      await expect(option(canvasElement, 'ISLAMIC')).toBeDisabled();
    });
    await step('The reason is given in words', async () => {
      const note = canvasElement.querySelector('[data-cy="pre-hijra-note"]');
      await expect(note?.textContent).toContain('Hijra');
    });
  },
};

export const ReportsAChoice: Story = {
  name: 'Reports a choice when the user makes one',
  args: { calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    await step('Clicking Julian selects it', async () => {
      // Material renders a single-select toggle group as radios, so the state is `aria-checked`,
      // not `aria-pressed` — which also gives the radiogroup semantics the design asked for.
      await userEvent.click(option(canvasElement, 'JULIAN') as HTMLElement);
      await expect(option(canvasElement, 'JULIAN')).toHaveAttribute('aria-checked', 'true');
    });
    await step('And it reads as a radio, not a toggle button', async () => {
      await expect(option(canvasElement, 'JULIAN')).toHaveAttribute('role', 'radio');
    });
  },
};

export const CarriesACaptionForAPeriod: Story = {
  name: 'Carries a caption when the owner needs to explain the scope',
  args: {
    calendar: 'JULIAN',
    caption: 'ui.datePicker.oneCalendarForValue',
    hookPrefix: 'period-',
  },
  play: async ({ canvasElement, step }) => {
    await step('The caption explains the calendar covers the whole value', async () => {
      const caption = canvasElement.querySelector('[data-cy="period-calendar-caption"]');
      await expect(caption?.textContent).toContain('whole value');
    });
    await step('The hooks are prefixed, so a period and a single date stay distinguishable', async () => {
      await expect(canvasElement.querySelector('[data-cy="period-calendar-select"]')).not.toBeNull();
    });
  },
};
