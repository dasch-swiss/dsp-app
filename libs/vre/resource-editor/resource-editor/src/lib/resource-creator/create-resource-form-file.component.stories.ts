import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CreateResourceFormFileComponent } from './create-resource-form-file.component';

const meta: Meta<CreateResourceFormFileComponent> = {
  title: 'Devs / Resource Editor / Resource Creator / Create Resource Form File',
  component: CreateResourceFormFileComponent,
  argTypes: {
    projectShortcode: {
      description: 'Project shortcode used for file upload destination.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    fileRepresentation: {
      description: 'The representation type string that determines which upload component to show.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    afterFormCreated: {
      description: 'Emitted with the created FileForm after the component initializes.',
      table: { type: { summary: 'EventEmitter<FileForm>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<CreateResourceFormFileComponent>;

export const DefaultView: Story = {
  name: 'Shows file upload form for the given representation type',
  args: {
    projectShortcode: 'test',
    fileRepresentation: 'http://api.knora.org/ontology/knora-api/v2#StillImageRepresentation',
  },
  play: async ({ canvasElement, step }) => {
    await step('Form container is rendered', async () => {
      const form = canvasElement.querySelector('form, app-create-resource-form-image, app-create-resource-form-representation');
      await expect(form).not.toBeNull();
    });
  },
};
