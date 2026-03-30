import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { CenteredMessageComponent } from './centered-message.component';

const meta: Meta<CenteredMessageComponent> = {
  title: 'UI / Centered Message / Empty State',
  component: CenteredMessageComponent,
  argTypes: {
    icon: {
      description: 'Material icon name displayed above the title. Leave empty to hide the icon.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    title: {
      description: 'Primary heading text.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    message: {
      description: 'Supporting body text shown below the title.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    color: {
      description: 'CSS color value applied to the icon, title, and message.',
      control: 'color',
      table: { type: { summary: 'string' }, defaultValue: { summary: '#757575' }, category: 'Appearance' },
    },
  },
};
export default meta;
type Story = StoryObj<CenteredMessageComponent>;

export const WithAllContent: Story = {
  name: 'Shows icon, title, and message when all inputs provided',
  args: {
    icon: 'search_off',
    title: 'No results found',
    message: 'Try adjusting your search filters or entering a different keyword.',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Title "No results found" is visible', async () => {
      await expect(canvas.getByText('No results found')).toBeInTheDocument();
    });
    await step('Supporting message is visible', async () => {
      await expect(canvas.getByText('Try adjusting your search filters or entering a different keyword.')).toBeInTheDocument();
    });
  },
};

export const TitleOnly: Story = {
  name: 'Shows only title when icon and message are omitted',
  args: { title: 'Nothing here yet' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Title "Nothing here yet" is visible', async () => {
      await expect(canvas.getByText('Nothing here yet')).toBeInTheDocument();
    });
    await step('No icon is rendered', async () => {
      await expect(canvasElement.querySelector('mat-icon')).toBeNull();
    });
  },
};

export const CustomColor: Story = {
  name: 'Applies custom color to all text elements',
  args: {
    icon: 'warning',
    title: 'Access denied',
    message: 'You do not have permission to view this resource.',
    color: '#d32f2f',
  },
};
