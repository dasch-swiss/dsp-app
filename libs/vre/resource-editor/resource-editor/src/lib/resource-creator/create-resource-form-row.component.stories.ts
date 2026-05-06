import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CreateResourceFormRowComponent } from './create-resource-form-row.component';

const meta: Meta<CreateResourceFormRowComponent> = {
  title: 'Resource Creator / 3. Properties / Create Resource Form Row',
  component: CreateResourceFormRowComponent,
  argTypes: {
    label: {
      description: 'Label shown in the left column of the form row.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    tooltip: {
      description: 'Optional tooltip shown on the label.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<CreateResourceFormRowComponent>;

export const DefaultView: Story = {
  name: 'Shows label and projected content in a form row',
  args: { label: 'Title' },
  render: args => ({
    props: args,
    template: `<app-create-resource-form-row label="Title">Content area</app-create-resource-form-row>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Label is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Title');
    });
    await step('Projected content is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Content area');
    });
  },
};

export const WithTooltip: Story = {
  name: 'Shows tooltip cursor on label when tooltip is set',
  args: { label: 'Description', tooltip: 'Enter a description for this resource.' },
  render: args => ({
    props: args,
    template: `<app-create-resource-form-row label="Description" tooltip="Enter a description for this resource.">Field</app-create-resource-form-row>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Label element has with-tooltip class', async () => {
      const h3 = canvasElement.querySelector('h3');
      await expect(h3?.classList.contains('with-tooltip')).toBe(true);
    });
  },
};
