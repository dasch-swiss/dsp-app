import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { OntologyFormComponent } from './ontology-form.component';

const meta: Meta<OntologyFormComponent> = {
  title: 'Ontology Editor / Common / Ontology Form',
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

export const CreateMode: Story = {
  name: 'Renders empty form in create mode',
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
  args: { mode: 'create' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Touching label input and tabbing away shows mat-error', async () => {
      const input = canvas.getByTestId('common-input-text');
      await userEvent.click(input);
      await userEvent.tab();
      const error = await canvas.findByText('This field is required');
      await expect(error).toBeInTheDocument();
    });
  },
};
