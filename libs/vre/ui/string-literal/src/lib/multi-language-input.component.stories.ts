import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DEFAULT_MULTILANGUAGE_FORM } from './default-multi-language-form';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { of } from 'rxjs';

import { MultiLanguageInputComponent } from './multi-language-input.component';

const userServiceStub = { currentUser: null, user$: of(null) };

const meta: Meta<MultiLanguageInputComponent> = {
  title: 'UI / String Literal / Multi Language Input',
  component: MultiLanguageInputComponent,
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
      description: 'Label displayed inside the input field.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    editable: {
      description: 'When false, the input is read-only.',
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
type Story = StoryObj<MultiLanguageInputComponent>;

export const Empty: Story = {
  name: 'Shows empty input with language selector',
  args: {
    formArray: DEFAULT_MULTILANGUAGE_FORM([]),
    placeholder: 'Label',
    editable: true,
    isRequired: false,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Label" placeholder is visible', async () => {
      await expect(canvas.getByPlaceholderText('Label')).toBeInTheDocument();
    });
  },
};

export const WithPrefilledValue: Story = {
  name: 'Displays existing value for the selected language',
  args: {
    formArray: DEFAULT_MULTILANGUAGE_FORM([{ language: 'en', value: 'My Project' }]),
    placeholder: 'Label',
    editable: true,
    isRequired: false,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"My Project" value is shown in the input', async () => {
      await expect(canvas.getByDisplayValue('My Project')).toBeInTheDocument();
    });
  },
};

export const ReadOnly: Story = {
  name: 'Shows read-only input that cannot be edited',
  args: {
    formArray: DEFAULT_MULTILANGUAGE_FORM([{ language: 'en', value: 'Read-only text' }]),
    placeholder: 'Label',
    editable: false,
    isRequired: false,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    await step('Input has readonly attribute', async () => {
      const input = canvasElement.querySelector('input');
      await expect(input).toHaveAttribute('readonly');
    });
  },
};
