import { KnoraDate, KnoraPeriod, ReadDateValue } from '@dasch-swiss/dsp-js';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { DateViewerComponent } from './date-viewer.component';

const makeSingleDate = (): ReadDateValue => {
  const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
  return { date } as unknown as ReadDateValue;
};

const makePeriod = (): ReadDateValue => {
  const start = new KnoraDate('GREGORIAN', 'CE', 2020, 1, 1);
  const end = new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31);
  const period = new KnoraPeriod(start, end);
  return { date: period } as unknown as ReadDateValue;
};

const meta: Meta<DateViewerComponent> = {
  title:
    'Devs / Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Date Viewer',
  component: DateViewerComponent,
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
  name: 'Shows a single Gregorian date',
  args: {
    value: makeSingleDate(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Calendar type indicator is rendered', async () => {
      const dateSwitchSpan = canvasElement.querySelector('[data-cy="date-switch"]');
      await expect(dateSwitchSpan).not.toBeNull();
    });
    await step('Calendar type text is not empty', async () => {
      const dateSwitchSpan = canvasElement.querySelector('[data-cy="date-switch"]');
      await expect(dateSwitchSpan?.textContent?.trim()).not.toBe('');
    });
  },
};

export const PeriodDate: Story = {
  name: 'Shows start and end dates for a date period',
  args: {
    value: makePeriod(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Two calendar type indicators are rendered for a period', async () => {
      const spans = canvasElement.querySelectorAll('[data-cy="date-switch"]');
      await expect(spans.length).toBe(2);
    });
  },
};
