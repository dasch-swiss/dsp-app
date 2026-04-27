import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { AlertInfoComponent } from './alert-info.component';

const meta: Meta<AlertInfoComponent> = {
  title: 'Devs / Resource Editor / Header / Alert Info',
  component: AlertInfoComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<AlertInfoComponent>;

export const DefaultView: Story = {
  name: 'Shows warning icon with projected content',
  render: () => ({
    props: {},
    template: `<app-alert-info>This is an alert message.</app-alert-info>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Warning icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('report_problem');
    });
    await step('Projected content is displayed', async () => {
      await expect(canvasElement.textContent).toContain('This is an alert message.');
    });
  },
};
