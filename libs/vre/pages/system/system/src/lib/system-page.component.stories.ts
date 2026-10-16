import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { STORY_PROVIDERS } from './stories.helpers';
import { SystemPageComponent } from './system-page.component';

const meta: Meta<SystemPageComponent> = {
  title: 'Pages / System / System Page',
  component: SystemPageComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<SystemPageComponent>;

export const ShowsProjectsAndUsersTabs: Story = {
  name: 'Shows the All Projects and All Users tabs',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('All Projects tab is visible', async () => {
      await expect(await canvas.findByRole('tab', { name: /All Projects/ })).toBeInTheDocument();
    });
    await step('All Users tab is visible', async () => {
      await expect(canvas.getByRole('tab', { name: /All Users/ })).toBeInTheDocument();
    });
  },
};
