import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../stories.helpers';
import { AdvancedSearchHeaderComponent } from './advanced-search-header.component';

const meta: Meta<AdvancedSearchHeaderComponent> = {
  title: 'Search / Advanced Search / 1. Header',
  component: AdvancedSearchHeaderComponent,
  argTypes: {
    isVerticalDirection: {
      description: 'Controls layout direction toggle button visibility and icon. Undefined hides the button.',
    },
    toggleDirection: { description: 'Emitted when the layout direction toggle button is clicked.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchHeaderComponent>;

const sharedProviders = [...STORY_PROVIDERS];

export const HorizontalLayout: Story = {
  name: 'Shows horizontal layout toggle button when direction is horizontal',
  args: { isVerticalDirection: false },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Header title is visible', async () => {
      await expect(canvas.getByText('Advanced search')).toBeInTheDocument();
    });
    await step('Toggle direction button is visible', async () => {
      await expect(canvasElement.querySelector('button[mat-icon-button]')).not.toBeNull();
    });
  },
};

export const VerticalLayout: Story = {
  name: 'Shows vertical layout toggle button when direction is vertical',
  args: { isVerticalDirection: true },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Header title is visible', async () => {
      await expect(canvas.getByText('Advanced search')).toBeInTheDocument();
    });
    await step('Toggle direction button is visible', async () => {
      await expect(canvasElement.querySelector('button[mat-icon-button]')).not.toBeNull();
    });
  },
};

export const NoDirectionControl: Story = {
  name: 'Hides layout toggle button when direction is undefined',
  args: { isVerticalDirection: undefined },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Header title is visible', async () => {
      await expect(canvas.getByText('Advanced search')).toBeInTheDocument();
    });
    await step('Toggle direction button is not rendered', async () => {
      await expect(canvasElement.querySelector('button[mat-icon-button]')).toBeNull();
    });
  },
};
