import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';

const meta: Meta<ResourceRepresentationContainerComponent> = {
  title: 'Resource Editor / Resource / Resource Representation Container',
  component: ResourceRepresentationContainerComponent,
  argTypes: {
    height: {
      description: "Controls the height mode of the representation container: 'auto', 'small', or 'big'.",
      table: { type: { summary: "'auto' | 'small' | 'big'" }, category: 'State' },
      control: { type: 'select' },
      options: ['auto', 'small', 'big'],
    },
  },
};
export default meta;
type Story = StoryObj<ResourceRepresentationContainerComponent>;

export const BigHeight: Story = {
  name: 'Shows representation container in big height mode',
  args: { height: 'big' },
  render: args => ({
    props: args,
    template: `<app-resource-representation-container height="big">Content</app-resource-representation-container>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container renders with projected content', async () => {
      await expect(canvasElement.textContent).toContain('Content');
    });
  },
};

export const SmallHeight: Story = {
  name: 'Shows representation container in small height mode',
  args: { height: 'small' },
  render: args => ({
    props: args,
    template: `<app-resource-representation-container height="small">Content</app-resource-representation-container>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container renders with projected content', async () => {
      await expect(canvasElement.textContent).toContain('Content');
    });
  },
};
