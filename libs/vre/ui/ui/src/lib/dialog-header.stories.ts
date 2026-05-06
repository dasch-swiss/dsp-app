import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { DialogHeaderComponent } from './dialog-header.component';

const meta: Meta<DialogHeaderComponent> = {
  title: 'UI / Dialog Header / Header',
  component: DialogHeaderComponent,
  argTypes: {
    title: {
      description: 'Main heading displayed in the dialog header.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    subtitle: {
      description: 'Optional secondary line displayed above the title.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<DialogHeaderComponent>;

export const WithTitleOnly: Story = {
  name: 'Shows title without subtitle',
  args: { title: 'Edit Resource' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Edit Resource" title is visible', async () => {
      await expect(canvas.getByText('Edit Resource')).toBeInTheDocument();
    });
  },
};

export const WithSubtitle: Story = {
  name: 'Shows both title and subtitle',
  args: {
    title: 'Edit Resource',
    subtitle: 'Resource class: Book',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Edit Resource" title is visible', async () => {
      await expect(canvas.getByText('Edit Resource')).toBeInTheDocument();
    });
    await step('"Resource class: Book" subtitle is visible', async () => {
      await expect(canvas.getByText('Resource class: Book')).toBeInTheDocument();
    });
  },
};
