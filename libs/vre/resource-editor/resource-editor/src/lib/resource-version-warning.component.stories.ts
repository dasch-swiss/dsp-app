import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ResourceVersionWarningComponent } from './resource-version-warning.component';

const meta: Meta<ResourceVersionWarningComponent> = {
  title: 'Devs / Resource Editor / Meta information / Resource Version Warning',
  component: ResourceVersionWarningComponent,
  argTypes: {
    resourceVersion: {
      description: 'The version timestamp string to display in the warning.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    navigateToCurrentVersion: {
      description: 'Emitted when the user clicks the link to the current version.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceVersionWarningComponent>;

export const DefaultView: Story = {
  name: 'Shows versioned resource warning with timestamp',
  args: {
    resourceVersion: '2024-06-15T10:00:00.000Z',
  },
  play: async ({ canvasElement, step }) => {
    await step('Version timestamp is displayed', async () => {
      await expect(canvasElement.textContent).toContain('2024-06-15T10:00:00.000Z');
    });
    await step('Warning icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('report_problem');
    });
  },
};
