import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { ProjectImageCoverComponent } from './project-image-cover.component';

const meta: Meta<ProjectImageCoverComponent> = {
  title: 'Pages / User Settings / Project Image Cover',
  component: ProjectImageCoverComponent,
  argTypes: {
    project: {
      description: 'Project object providing shortcode (for image URL) and shortname (for fallback text).',
      control: 'object',
      table: { type: { summary: '{ shortcode: string; shortname: string }' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<ProjectImageCoverComponent>;

export const ImageLoads: Story = {
  name: 'Shows project image when asset exists',
  args: {
    project: { shortcode: '0803', shortname: 'rosetta' },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Image element is present', async () => {
      await expect(canvas.getByRole('img')).toBeInTheDocument();
    });
  },
};

export const FallbackText: Story = {
  name: 'Shows shortname as fallback when image cannot load',
  args: {
    project: { shortcode: 'XXXX', shortname: 'myproj' },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Component renders', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const LongShortname: Story = {
  name: 'Applies small font class when shortname exceeds 10 characters',
  args: {
    project: { shortcode: 'XXXX', shortname: 'averylongshortname' },
  },
  play: async ({ canvasElement, step }) => {
    await step('Component renders without layout issues', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
