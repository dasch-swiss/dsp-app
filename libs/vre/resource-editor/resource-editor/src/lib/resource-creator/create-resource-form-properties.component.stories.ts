import { FormBuilder } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CreateResourceFormPropertiesComponent } from './create-resource-form-properties.component';

const meta: Meta<CreateResourceFormPropertiesComponent> = {
  title: 'Devs / Resource Creator / 3. Properties / Create Resource Form Properties',
  component: CreateResourceFormPropertiesComponent,
  argTypes: {
    resourceClassIri: {
      description: 'IRI of the resource class.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    projectIri: {
      description: 'IRI of the project.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Shortcode of the project.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    formGroup: {
      description: 'FormGroup holding the property value arrays.',
      table: { type: { summary: 'FormGroup<{ [key: string]: FormValueArray }>' }, category: 'State' },
    },
    properties: {
      description: 'List of property definitions with their values.',
      table: { type: { summary: 'PropertyInfoValues[]' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<CreateResourceFormPropertiesComponent>;

export const NoProperties: Story = {
  name: 'Renders nothing when the property list is empty',
  args: {
    resourceClassIri: 'http://example.org/onto#Thing',
    projectIri: 'http://rdfh.ch/projects/test',
    projectShortcode: 'test',
    properties: [],
    formGroup: new FormBuilder().group({}) as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Component host is rendered', async () => {
      await expect(canvasElement.querySelector('app-create-resource-form-properties')).not.toBeNull();
    });
  },
};
