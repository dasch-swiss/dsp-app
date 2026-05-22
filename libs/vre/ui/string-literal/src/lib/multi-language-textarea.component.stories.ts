import { UserService } from '@dasch-swiss/vre/core/session';
import { DEFAULT_MULTILANGUAGE_FORM } from './default-multi-language-form';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { of } from 'rxjs';

import { MultiLanguageTextareaComponent } from './multi-language-textarea.component';

const userServiceStub = { currentUser: null, user$: of(null) };

const meta: Meta<MultiLanguageTextareaComponent> = {
  title: 'UI / String Literal / Multi Language Textarea',
  component: MultiLanguageTextareaComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: UserService, useValue: userServiceStub }],
    }),
  ],
  argTypes: {
    formArray: {
      description: 'FormArray of language/value group controls.',
      table: { type: { summary: 'MultiLanguageFormArray' }, category: 'State' },
    },
    placeholder: {
      description: 'Label displayed inside the textarea.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    editable: {
      description: 'When false, the textarea is read-only.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Behavior' },
    },
    isRequired: {
      description: 'Marks the field as required.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<MultiLanguageTextareaComponent>;

export const Empty: Story = {
  name: 'Shows empty textarea with language toggle buttons',
  args: {
    formArray: DEFAULT_MULTILANGUAGE_FORM([]),
    placeholder: 'Description',
    editable: true,
    isRequired: false,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    await step('Textarea is rendered', async () => {
      await expect(canvasElement.querySelector('textarea')).not.toBeNull();
    });
    await step('Language toggle buttons are rendered', async () => {
      await expect(canvasElement.querySelector('mat-button-toggle-group')).not.toBeNull();
    });
  },
};

export const WithPrefilledValue: Story = {
  name: 'Displays existing value for the selected language',
  args: {
    formArray: DEFAULT_MULTILANGUAGE_FORM([{ language: 'en', value: 'A longer description of the project.' }]),
    placeholder: 'Description',
    editable: true,
    isRequired: false,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Pre-filled text is visible in the textarea', async () => {
      await expect(canvas.getByDisplayValue('A longer description of the project.')).toBeInTheDocument();
    });
  },
};

export const ReadOnly: Story = {
  name: 'Shows read-only textarea that cannot be edited',
  args: {
    formArray: DEFAULT_MULTILANGUAGE_FORM([{ language: 'en', value: 'Read-only content' }]),
    placeholder: 'Description',
    editable: false,
    isRequired: false,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    await step('Textarea has readonly attribute', async () => {
      const textarea = canvasElement.querySelector('textarea');
      await expect(textarea).toHaveAttribute('readonly');
    });
  },
};

export const MultipleLanguages: Story = {
  name: 'Shows content in multiple languages with toggle',
  args: {
    formArray: DEFAULT_MULTILANGUAGE_FORM([
      { language: 'en', value: 'English description' },
      { language: 'de', value: 'Deutsche Beschreibung' },
    ]),
    placeholder: 'Description',
    editable: true,
    isRequired: false,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    await step('Language toggle group contains language buttons', async () => {
      const toggleGroup = canvasElement.querySelector('mat-button-toggle-group');
      await expect(toggleGroup).not.toBeNull();
    });
  },
};
