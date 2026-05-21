import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { ImageDisplayAbsoluteComponent } from './image-display-absolute.component';

const meta: Meta<ImageDisplayAbsoluteComponent> = {
  title: 'Pages / Project / Image Settings / Image Display Absolute',
  component: ImageDisplayAbsoluteComponent,
  argTypes: {
    widthPx: {
      description: 'The absolute pixel width the image will be restricted to (between 128 and 1024).',
      control: { type: 'range', min: 128, max: 1024, step: 32 },
      table: { type: { summary: 'number' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<ImageDisplayAbsoluteComponent>;

export const SmallRestriction: Story = {
  name: 'Shows 256px width restriction preview',
  args: { widthPx: 256 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Pixel value label is displayed', async () => {
      await expect(canvas.getByText(/256/)).toBeInTheDocument();
    });
    await step('Reference image width text is present', async () => {
      await expect(canvas.getByText(/2048/)).toBeInTheDocument();
    });
  },
};

export const LargeRestriction: Story = {
  name: 'Shows 1024px width restriction preview',
  args: { widthPx: 1024 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Pixel value label is displayed', async () => {
      await expect(canvas.getByText(/1024/)).toBeInTheDocument();
    });
  },
};
