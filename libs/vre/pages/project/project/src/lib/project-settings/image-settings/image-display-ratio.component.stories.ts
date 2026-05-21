import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { ImageDisplayRatioComponent } from './image-display-ratio.component';

const meta: Meta<ImageDisplayRatioComponent> = {
  title: 'Pages / Project / Image Settings / Image Display Ratio',
  component: ImageDisplayRatioComponent,
  argTypes: {
    ratio: {
      description: 'A value between 0 and 1 representing the percentage of the original image size to display.',
      control: { type: 'range', min: 0.1, max: 1, step: 0.05 },
      table: { type: { summary: 'number' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<ImageDisplayRatioComponent>;

export const HalfSize: Story = {
  name: 'Shows 50% ratio preview with correct label',
  args: { ratio: 0.5 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Ratio label shows 50%', async () => {
      await expect(canvas.getByText(/50%/)).toBeInTheDocument();
    });
  },
};

export const FullSize: Story = {
  name: 'Shows 100% ratio filling the preview frame',
  args: { ratio: 1 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Ratio label shows 100%', async () => {
      await expect(canvas.getByText(/100%/)).toBeInTheDocument();
    });
  },
};

export const SmallRatio: Story = {
  name: 'Shows 10% ratio as a small rectangle in the corner',
  args: { ratio: 0.1 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Ratio label shows 10%', async () => {
      await expect(canvas.getByText(/10%/)).toBeInTheDocument();
    });
  },
};
