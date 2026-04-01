import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';

import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ChipListInputComponent } from './chip-list-input.component';

const fb = new FormBuilder();

const meta: Meta<ChipListInputComponent> = {
  title: 'UI / Chip List Input / Keywords',
  component: ChipListInputComponent,
  argTypes: {
    formArray: {
      description: 'FormArray of string FormControls holding the current chip values.',
      table: { type: { summary: 'FormArray<FormControl<string>>' }, category: 'State' },
    },
    validators: {
      description: 'Validator functions applied to each newly added chip value.',
      table: { type: { summary: 'ValidatorFn[]' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<ChipListInputComponent>;

export const Empty: Story = {
  name: 'Shows empty chip input ready for entry',
  args: {
    formArray: fb.array<FormControl<string>>([]),
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Chip input is rendered', async () => {
      await expect(canvasElement.querySelector('mat-chip-grid')).not.toBeNull();
    });
  },
};

export const WithExistingChips: Story = {
  name: 'Displays pre-populated chip values',
  args: {
    formArray: fb.array([
      fb.control('angular', { nonNullable: true }),
      fb.control('storybook', { nonNullable: true }),
    ]) as FormArray<FormControl<string>>,
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"angular" chip is visible', async () => {
      await expect(canvas.getByText('angular')).toBeInTheDocument();
    });
    await step('"storybook" chip is visible', async () => {
      await expect(canvas.getByText('storybook')).toBeInTheDocument();
    });
  },
};

export const AddsNewChip: Story = {
  name: 'Adds a new chip when user types and presses Enter',
  args: {
    formArray: fb.array<FormControl<string>>([]),
    validators: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector<HTMLInputElement>('input[matChipInput]')!;
    await step('User types "history" and presses Enter', async () => {
      await userEvent.click(input);
      await userEvent.type(input, 'history{enter}');
    });
    await step('"history" chip appears in the list', async () => {
      await expect(canvas.getByText('history')).toBeInTheDocument();
    });
  },
};

export const WithRequiredValidator: Story = {
  name: 'Shows required error when formArray is touched and empty',
  args: {
    formArray: (() => {
      const arr = fb.array<FormControl<string>>([], Validators.required);
      arr.markAsTouched();
      return arr;
    })(),
    validators: [],
  },
};
