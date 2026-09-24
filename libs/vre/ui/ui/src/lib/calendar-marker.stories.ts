import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { Observable, of } from 'rxjs';
import { expect, userEvent } from 'storybook/test';

import { CalendarMarkerComponent } from './calendar-marker.component';

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
      description: 'The calendar the value is stored in. Shown at rest and kept visible as the anchor.',
      control: 'select',
      options: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
      table: { type: { summary: 'CalendarSystem' }, category: 'State' },
    },
    availableCalendars: {
      description:
        'Calendars this value can be shown in. One omitted here is disabled in the menu, so a conversion that cannot be represented is never offered.',
      control: 'object',
      table: { type: { summary: 'readonly CalendarSystem[]' }, category: 'State' },
    },
    displayCalendarChange: {
      description: 'Emitted when the reader picks another calendar. Ephemeral — the owner re-renders, nothing saves.',
      table: { type: { summary: 'EventEmitter<CalendarSystem>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<CalendarMarkerComponent>;

export const StatesTheStoredCalendarAtRest: Story = {
  name: 'States the stored calendar without any interaction',
  args: {
    storedCalendar: 'JULIAN',
    availableCalendars: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
  },
  play: async ({ canvasElement, step }) => {
    await step('The stored calendar is named on the face of the control', async () => {
      const label = canvasElement.querySelector('[data-cy="calendar-marker-label"]');
      await expect(label?.textContent?.trim()).toBe('Julian');
    });
    await step('No "stored as" note appears while the value is shown in its own calendar', async () => {
      await expect(canvasElement.querySelector('[data-cy="calendar-marker-stored"]')).toBeNull();
    });
  },
};

export const ShowsStoredCalendarWhenConverted: Story = {
  name: 'Keeps the stored calendar visible once another is chosen',
  args: {
    storedCalendar: 'JULIAN',
    availableCalendars: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker and picks Gregorian', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement);
      const option = document.querySelector('[data-cy="calendar-option-GREGORIAN"]') as HTMLElement;
      await userEvent.click(option);
    });
    await step('The face now names Gregorian', async () => {
      const label = canvasElement.querySelector('[data-cy="calendar-marker-label"]');
      await expect(label?.textContent?.trim()).toBe('Gregorian');
    });
    await step('The value still says it is stored as Julian, so a citation stays honest', async () => {
      const stored = canvasElement.querySelector('[data-cy="calendar-marker-stored"]');
      await expect(stored?.textContent).toContain('Julian');
    });
  },
};

export const DoesNotOfferAnUnavailableCalendar: Story = {
  name: 'Disables a calendar the value cannot be represented in',
  args: {
    storedCalendar: 'JULIAN',
    // A pre-Hijra date has no Islamic form, so the owner leaves it out.
    availableCalendars: ['GREGORIAN', 'JULIAN'],
  },
  play: async ({ canvasElement, step }) => {
    await step('The reader opens the marker', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement);
    });
    await step('Islamic is present but cannot be chosen', async () => {
      const islamic = document.querySelector('[data-cy="calendar-option-ISLAMIC"]') as HTMLButtonElement;
      await expect(islamic).not.toBeNull();
      await expect(islamic.disabled).toBe(true);
    });
    await step('Gregorian remains selectable', async () => {
      const gregorian = document.querySelector('[data-cy="calendar-option-GREGORIAN"]') as HTMLButtonElement;
      await expect(gregorian.disabled).toBe(false);
    });
  },
};

export const OperatesByKeyboardAlone: Story = {
  name: 'Can be opened and used without a mouse',
  args: {
    // Stored as Julian so that selecting Gregorian is a real change, not a no-op.
    storedCalendar: 'JULIAN',
    availableCalendars: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
  },
  play: async ({ canvasElement, step }) => {
    // The repo has no automated accessibility lint, so this story is what catches a regression.
    await step('The marker takes focus by tabbing', async () => {
      await userEvent.tab();
      await expect(canvasElement.querySelector('[data-cy="calendar-marker"]')).toHaveFocus();
    });
    await step('Enter opens the calendar menu', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(document.querySelector('[data-cy="calendar-option-JULIAN"]')).not.toBeNull();
    });
    await step('Opening the menu puts focus on an option, so arrow keys can take over', async () => {
      // Material's FocusKeyManager owns the arrowing itself; this asserts the handover into it,
      // which is the part the component is responsible for. Driving the arrow keys here would
      // test Material rather than this component — synthetic key events do not reach its manager.
      await expect(document.querySelector('[data-cy="calendar-option-GREGORIAN"]')).toHaveFocus();
    });
    await step('Enter on the focused option selects it, with no mouse involved', async () => {
      await userEvent.keyboard('{Enter}');
      const label = canvasElement.querySelector('[data-cy="calendar-marker-label"]');
      await expect(label?.textContent?.trim()).toBe('Gregorian');
    });
  },
};

export const NamesBothCalendarsToAssistiveTechnology: Story = {
  name: 'Exposes the displayed and the stored calendar to screen readers',
  args: {
    storedCalendar: 'ISLAMIC',
    availableCalendars: ['GREGORIAN', 'JULIAN', 'ISLAMIC'],
  },
  play: async ({ canvasElement, step }) => {
    await step('At rest the accessible name states the stored calendar', async () => {
      const marker = canvasElement.querySelector('[data-cy="calendar-marker"]');
      await expect(marker?.getAttribute('aria-label')).toBe('Calendar: ISLAMIC');
    });
    await step('Once converted it names both', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="calendar-marker"]') as HTMLElement);
      await userEvent.click(document.querySelector('[data-cy="calendar-option-GREGORIAN"]') as HTMLElement);
      const marker = canvasElement.querySelector('[data-cy="calendar-marker"]');
      await expect(marker?.getAttribute('aria-label')).toBe('Calendar: GREGORIAN, stored as ISLAMIC');
    });
  },
};
