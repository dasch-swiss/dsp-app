import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { OntologyFormComponent } from './ontology-form.component';

const meta: Meta<OntologyFormComponent> = {
  title: 'Ontology / Forms / Ontology Form',
  component: OntologyFormComponent,
  argTypes: {
    mode: {
      description: 'Whether the form is in create or edit mode.',
      control: 'radio',
      options: ['create', 'edit'],
      table: { type: { summary: "'create' | 'edit'" }, category: 'Inputs' },
    },
    data: {
      description: 'Pre-filled ontology data for edit mode.',
      table: { type: { summary: 'UpdateOntologyData | undefined' }, category: 'Inputs' },
    },
    afterFormInit: {
      description: 'Emitted once the form group is built, carrying the typed FormGroup.',
      table: { type: { summary: 'OntologyForm' }, category: 'Outputs' },
    },
  },
};
export default meta;
type Story = StoryObj<OntologyFormComponent>;

const sharedDecorators = [
  applicationConfig({
    providers: [provideAnimations(), ...TranslateModule.forRoot().providers!],
  }),
];

export const CreateMode: Story = {
  name: 'Renders empty form in create mode',
  decorators: sharedDecorators,
  args: { mode: 'create' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label input is present and empty', async () => {
      const label = canvas.getByTestId('label-input');
      await expect(label).toBeInTheDocument();
    });
  },
};

export const EditMode: Story = {
  name: 'Pre-fills form fields in edit mode',
  decorators: sharedDecorators,
  args: {
    mode: 'edit',
    data: { id: 'http://0.0.0.0:3333/ontology/0001/test/v2', label: 'My Ontology', comment: 'Describes test data' },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Comment textarea shows pre-filled value', async () => {
      const textarea = canvas.getByTestId('comment-textarea');
      await expect(textarea).toHaveValue('Describes test data');
    });
  },
};

export const ShowsValidationErrors: Story = {
  name: 'Shows required validation on submit attempt',
  decorators: sharedDecorators,
  args: { mode: 'create' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Touching label and tabbing away shows mat-error', async () => {
      const label = canvas.getByTestId('label-input');
      await userEvent.click(label);
      await userEvent.tab();
      await expect(canvas.getByRole('alert')).toBeInTheDocument();
    });
  },
};
