import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { IncomingResourcePagerComponent } from './incoming-resource-pager.component';

const meta: Meta<IncomingResourcePagerComponent> = {
  title: 'Devs / Resource Editor / Properties Display / Incoming Resource Pager',
  component: IncomingResourcePagerComponent,
  argTypes: {
    pageIndex: {
      description: 'Current page index (zero-based).',
      table: { type: { summary: 'number' }, category: 'State' },
    },
    pageSize: {
      description: 'Number of items per page.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
    itemsNumber: {
      description: 'Total number of items across all pages.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
    pageChanged: {
      description: 'Emitted with the new page index when the user navigates.',
      table: { type: { summary: 'EventEmitter<number>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<IncomingResourcePagerComponent>;

export const MiddlePage: Story = {
  name: 'Shows previous and next buttons when on a middle page',
  args: { pageIndex: 1, pageSize: 25, itemsNumber: 80 },
  play: async ({ canvasElement, step }) => {
    await step('Previous button is enabled', async () => {
      const prev = canvasElement.querySelector('.previous') as HTMLButtonElement;
      await expect(prev.disabled).toBe(false);
    });
    await step('Next button is enabled', async () => {
      const next = canvasElement.querySelector('.next') as HTMLButtonElement;
      await expect(next.disabled).toBe(false);
    });
    await step('Range is displayed', async () => {
      await expect(canvasElement.textContent).toContain('26');
    });
  },
};

export const FirstPage: Story = {
  name: 'Disables previous button on first page',
  args: { pageIndex: 0, pageSize: 25, itemsNumber: 80 },
  play: async ({ canvasElement, step }) => {
    await step('Previous button is disabled', async () => {
      const prev = canvasElement.querySelector('.previous') as HTMLButtonElement;
      await expect(prev.disabled).toBe(true);
    });
  },
};
