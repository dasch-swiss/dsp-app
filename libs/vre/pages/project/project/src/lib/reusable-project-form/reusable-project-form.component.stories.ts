import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ReusableProjectFormComponent } from './reusable-project-form.component';

const emptyFormData = {
  shortcode: '',
  shortname: '',
  longname: '',
  description: [],
  keywords: [],
};

const meta: Meta<ReusableProjectFormComponent> = {
  title: 'Pages / Project / Reusable Project Form',
  component: ReusableProjectFormComponent,
  argTypes: {
    formData: {
      description:
        'Initial values for the form. An empty shortcode means a new project, which enables the ' +
        'uniqueness check against the existing shortcodes.',
      table: { category: 'Content' },
    },
    afterFormInit: {
      description: 'Emits the built FormGroup once, so the hosting page can submit and validate it.',
      table: { category: 'Events' },
    },
  },
  decorators: [
    applicationConfig({
      providers: [{ provide: AllProjectsService, useValue: { allProjects$: of([]) } }],
    }),
  ],
};
export default meta;
type Story = StoryObj<ReusableProjectFormComponent>;

export const DefaultView: Story = {
  name: 'Shows the shortcode, short name, project name, description and keywords fields',
  args: { formData: emptyFormData },
  play: async ({ canvasElement, step }) => {
    await step('Every field of a new project is rendered', async () => {
      for (const field of ['shortcode-input', 'shortname-input', 'longname-input', 'description-input']) {
        await expect(canvasElement.querySelector(`[data-cy="${field}"]`)).not.toBeNull();
      }
    });
  },
};

export const SpacesItsFieldsEvenly: Story = {
  name: 'Keeps a gap between every pair of adjacent fields',
  args: { formData: emptyFormData },
  // DEV-7450: the Shortcode/Short name row touched Project name and Project name touched
  // Description, because a pristine field reserved no space below itself. Every field here is
  // required and untouched on load, which is exactly the state that regressed.
  play: async ({ canvasElement, step }) => {
    await step('No message is shown on a pristine form', async () => {
      await expect(canvasElement.querySelector('mat-error')).toBeNull();
    });
    await step('The shortcode row, project name and description do not touch', async () => {
      const row = canvasElement.querySelector('[data-cy="shortcode-input"] .mat-mdc-text-field-wrapper')!;
      const longname = canvasElement.querySelector('[data-cy="longname-input"] .mat-mdc-text-field-wrapper')!;
      const description = canvasElement.querySelector('[data-cy="description-input"] .mat-mdc-text-field-wrapper')!;

      const gaps = [
        longname.getBoundingClientRect().top - row.getBoundingClientRect().bottom,
        description.getBoundingClientRect().top - longname.getBoundingClientRect().bottom,
      ];

      for (const gap of gaps) {
        await expect(gap).toBeGreaterThanOrEqual(12);
      }
    });
  },
};
