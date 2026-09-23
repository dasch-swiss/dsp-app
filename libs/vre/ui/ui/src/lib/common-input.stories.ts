import { FormControl, Validators } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { CommonInputComponent } from './common-input.component';

const meta: Meta<CommonInputComponent> = {
  title: 'UI / Common Input',
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
    control: new FormControl('', Validators.required) as FormControl<string>,
    label: 'Required field',
    validatorErrors: [{ errorKey: 'required', message: 'This field is required' }],
    type: 'text',
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('Field is touched to trigger validation', async () => {
      (args.control as FormControl).markAsTouched();
      (args.control as FormControl).updateValueAndValidity();
      await userEvent.click(canvas.getByPlaceholderText('Required field'));
      await userEvent.tab();
    });
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

export const WrapsLongValidationError: Story = {
  name: 'Wraps a long validation error instead of clipping it',
  args: {
    control: new FormControl('12312323', Validators.pattern(/^[a-zA-Z][a-zA-Z0-9._-]*$/)) as FormControl<string>,
    label: 'Set a unique name',
    validatorErrors: [
      {
        errorKey: 'pattern',
        // The real DEV-7283 message: long enough to need more than one line in a narrow field.
        message:
          'The name must start with a letter and may only contain letters, digits, hyphens, dots and underscores.',
      },
    ],
    type: 'text',
  },
  // Constrain the width so the message is guaranteed to wrap, as it does in the dialog.
  render: args => ({
    props: args,
    template: `<div style="width: 320px"><app-common-input [control]="control" [label]="label"
        [validatorErrors]="validatorErrors" [type]="type" /></div>`,
    moduleMetadata: { imports: [CommonInputComponent] },
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('Field is touched to trigger validation', async () => {
      (args.control as FormControl).markAsTouched();
      (args.control as FormControl).updateValueAndValidity();
      await userEvent.click(canvas.getByPlaceholderText('Set a unique name'));
      await userEvent.tab();
    });
    await step('The subscript grows to contain the wrapped error instead of clipping it', async () => {
      const error = canvas.getByText(/The name must start with a letter/);
      await expect(error).toBeInTheDocument();

      // The message is long enough to wrap onto more than one line at this width.
      const errorHeight = error.getBoundingClientRect().height;
      const lineHeight = parseFloat(getComputedStyle(error).lineHeight);
      await expect(errorHeight).toBeGreaterThan(lineHeight * 1.5);

      // Without subscriptSizing="dynamic" the error is absolutely positioned inside a subscript
      // reserved for a single line, so the wrapper stays short and the extra lines are clipped.
      // The fix makes the wrapper grow to contain the full message (DEV-7283).
      const wrapper = error.closest('.mat-mdc-form-field-subscript-wrapper') as HTMLElement;
      await expect(wrapper).not.toBeNull();
      await expect(wrapper.getBoundingClientRect().height).toBeGreaterThanOrEqual(errorHeight);
    });
  },
};
