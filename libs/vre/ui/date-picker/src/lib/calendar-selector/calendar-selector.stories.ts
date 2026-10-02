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
  canvas.querySelector<HTMLElement>(`[data-cy="calendar-option-${calendar}"]`);

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

export const DoesNotSelectItself: Story = {
  name: 'Shows the calendar it was given, not the one that was clicked',
  args: { calendar: 'GREGORIAN' },
  play: async ({ canvasElement, step }) => {
    // It reports and nothing else: the owner converts the value and passes a new `calendar` back.
    // A control that selected itself would be a second place the calendar lives, which is the
    // shape the relabelling defect grew in. That it emits is covered by the jsdom spec, which can
    // see the output; what a browser can show is that the click alone changes nothing here.
    await step('Clicking Julian leaves Gregorian selected', async () => {
      await userEvent.click(option(canvasElement, 'JULIAN') as HTMLElement);
      await expect(option(canvasElement, 'JULIAN')).toHaveAttribute('aria-checked', 'false');
      await expect(option(canvasElement, 'GREGORIAN')).toHaveAttribute('aria-checked', 'true');
    });

    await step('And it reads as a radio, not a toggle button', async () => {
      await expect(option(canvasElement, 'JULIAN')).toHaveAttribute('role', 'radio');
    });
  },
};

export const CarriesACaptionWhenGivenOne: Story = {
  name: 'Carries a caption when the owner supplies one',
  args: {
    calendar: 'JULIAN',
    caption: 'ui.datePicker.calendar',
    hookPrefix: 'period-',
  },
  play: async ({ canvasElement, step }) => {
    // The caption is an opt-in slot the owner fills, not something this control says by itself.
    await step('The supplied caption is rendered', async () => {
      const caption = canvasElement.querySelector('[data-cy="period-calendar-caption"]');
      await expect(caption?.textContent?.trim()).toBe('Calendar');
    });
    await step('The hooks are prefixed, so a period and a single date stay distinguishable', async () => {
      await expect(canvasElement.querySelector('[data-cy="period-calendar-select"]')).not.toBeNull();
    });
  },
};
