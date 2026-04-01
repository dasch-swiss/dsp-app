import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent, fn } from 'storybook/test';

import { PagerComponent } from './pager.component';

const meta: Meta<PagerComponent> = {
  title: 'UI / Pager / Pagination',
  component: PagerComponent,
  argTypes: {
    numberOfAllResults: {
      description: 'Total number of results across all pages. Used to calculate the last page index.',
      control: 'number',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' }, category: 'State' },
    },
    pageSize: {
      description: 'Number of results shown per page.',
      control: 'number',
      table: { type: { summary: 'number' }, defaultValue: { summary: '25' }, category: 'Behavior' },
    },
    pageIndexChanged: {
      description: 'Emitted when the user navigates to a different page. Carries the zero-based page index.',
      table: { category: 'Events', type: { summary: 'EventEmitter<number>' } },
    },
  },
};
export default meta;
type Story = StoryObj<PagerComponent>;

export const FirstPage: Story = {
  name: 'Shows first page with correct item range',
  args: {
    numberOfAllResults: 100,
    pageSize: 25,
    pageIndexChanged: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Item range shows "1 - 25 of 100"', async () => {
      await expect(canvas.getByText(/1 - 25/)).toBeInTheDocument();
    });
  },
};

export const SinglePage: Story = {
  name: 'Disables navigation when all results fit on one page',
  args: {
    numberOfAllResults: 10,
    pageSize: 25,
    pageIndexChanged: fn(),
  },
};

export const NoResults: Story = {
  name: 'Shows zero range when there are no results',
  args: {
    numberOfAllResults: 0,
    pageSize: 25,
    pageIndexChanged: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Item range shows "0 - 0 of 0"', async () => {
      await expect(canvas.getByText(/0 - 0/)).toBeInTheDocument();
    });
  },
};

export const NavigatesToNextPage: Story = {
  name: 'Navigates to next page when next button is clicked',
  args: {
    numberOfAllResults: 100,
    pageSize: 25,
    pageIndexChanged: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    await step('User clicks the next page button', async () => {
      const nextButton = canvasElement.querySelector<HTMLButtonElement>('[data-testid="next-page"]');
      await userEvent.click(nextButton!);
    });
    await step('pageIndexChanged emits page index 1', async () => {
      await expect(args.pageIndexChanged).toHaveBeenCalledWith(1);
    });
  },
};
