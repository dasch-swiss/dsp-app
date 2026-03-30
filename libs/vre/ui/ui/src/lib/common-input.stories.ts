import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { FormControl, Validators } from '@angular/forms';
import { CommonInputComponent } from './common-input.component';

const meta: Meta<CommonInputComponent> = {
  title: 'UI / Common Input / Text Field',
  component: CommonInputComponent,
  argTypes: {
    label: {
      description: 'The field label shown as placeholder and mat-label.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    withLabel: {
      description: 'When false, the mat-label is hidden and only the placeholder is used.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Appearance' },
    },
    prefixIcon: {
      description: 'Material icon name shown as a prefix inside the form field. Leave null to hide.',
      control: 'text',
      table: { type: { summary: 'string | null' }, defaultValue: { summary: 'null' }, category: 'Appearance' },
    },
    type: {
      description: 'Input type. "text" for string values, "number" for numeric values.',
      control: 'select',
      options: ['text', 'number'],
      table: { type: { summary: "'text' | 'number'" }, defaultValue: { summary: 'text' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<CommonInputComponent>;

export const EmptyTextField: Story = {
  name: 'Shows empty text field with label',
  args: {
    control: new FormControl('') as FormControl<string>,
    label: 'Project title',
    withLabel: true,
    prefixIcon: null,
    type: 'text',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input field with placeholder "Project title" is visible', async () => {
      await expect(canvas.getByPlaceholderText('Project title')).toBeInTheDocument();
    });
  },
};

export const WithPrefixIcon: Story = {
  name: 'Shows prefix icon inside the field',
  args: {
    control: new FormControl('') as FormControl<string>,
    label: 'Search',
    prefixIcon: 'search',
    type: 'text',
  },
};

export const ShowsValidationError: Story = {
  name: 'Shows validation error when field is touched and invalid',
  args: {
    control: (() => {
      const c = new FormControl('', Validators.required);
      c.markAsTouched();
      return c as FormControl<string>;
    })(),
    label: 'Required field',
    validatorErrors: [{ errorKey: 'required', message: 'This field is required' }],
    type: 'text',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Validation error "This field is required" is shown', async () => {
      await expect(canvas.getByText('This field is required')).toBeInTheDocument();
    });
  },
};

export const AcceptsUserInput: Story = {
  name: 'Accepts and displays typed text',
  args: {
    control: new FormControl('') as FormControl<string>,
    label: 'Description',
    type: 'text',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Description');
    await step('User types "Hello world"', async () => {
      await userEvent.type(input, 'Hello world');
    });
    await step('Input displays "Hello world"', async () => {
      await expect(input).toHaveValue('Hello world');
    });
  },
};
