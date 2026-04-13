import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { AppProgressIndicatorComponent } from './app-progress-indicator.component';

const meta: Meta<AppProgressIndicatorComponent> = {
  title: 'UI / Progress Indicator / Spinner',
  component: AppProgressIndicatorComponent,
  argTypes: {
    size: {
      description:
        'Controls the diameter of the spinner. Use "xsmall" or "small" for inline contexts, "large" for full-page loading states.',
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large'],
      table: {
        type: { summary: "'xsmall' | 'small' | 'medium' | 'large'" },
        defaultValue: { summary: 'small' },
        category: 'Appearance',
      },
    },
  },
};
export default meta;
type Story = StoryObj<AppProgressIndicatorComponent>;

export const Default: Story = {
  name: 'Shows spinner at default (small) size',
  args: { size: 'small' },
  play: async ({ canvasElement, step }) => {
    await step('Spinner element is rendered in the DOM', async () => {
      await expect(canvasElement.querySelector('[data-cy="loader"]')).not.toBeNull();
    });
  },
};

export const MediumSize: Story = {
  name: 'Shows medium spinner for section-level loading',
  args: { size: 'medium' },
};

export const LargeSize: Story = {
  name: 'Shows large spinner for full-page loading states',
  args: { size: 'large' },
};
