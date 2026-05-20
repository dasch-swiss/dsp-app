import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { ResourceClassFormComponent } from './resource-class-form.component';

const meta: Meta<ResourceClassFormComponent> = {
  title: 'Ontology / Forms / Resource Class Form',
  component: ResourceClassFormComponent,
  argTypes: {
    formData: {
      description: 'Initial data for the resource class form (name, labels, comments).',
      table: { type: { summary: 'ResourceClassFormData' }, category: 'Inputs' },
    },
    afterFormInit: {
      description: 'Emitted once the form group is built.',
      table: { type: { summary: 'ResourceClassForm' }, category: 'Outputs' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceClassFormComponent>;

const sharedDecorators = [
  applicationConfig({
    providers: [
      provideAnimations(),
      ...STORY_PROVIDERS,
      { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
    ],
  }),
];

export const EmptyCreateForm: Story = {
  name: 'Renders empty form for creating a resource class',
  decorators: sharedDecorators,
  args: {
    formData: { name: '', labels: [], comments: [] },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Name input is present', async () => {
      await expect(canvas.getByTestId('name-input')).toBeInTheDocument();
    });
    await step('Label input is present', async () => {
      await expect(canvas.getByTestId('label-input')).toBeInTheDocument();
    });
  },
};

export const PreFilledEditForm: Story = {
  name: 'Pre-fills form fields for editing a resource class',
  decorators: sharedDecorators,
  args: {
    formData: {
      name: 'TestClass',
      labels: [{ language: 'en', value: 'Test Class' }],
      comments: [{ language: 'en', value: 'A test class comment' }],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Name input is pre-filled with TestClass', async () => {
      const nameInput = canvas.getByTestId('name-input');
      await expect(nameInput).toHaveValue('TestClass');
    });
  },
};
