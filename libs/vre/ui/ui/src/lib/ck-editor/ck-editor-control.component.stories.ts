import { FormControl } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { CkEditorControlComponent } from './ck-editor-control.component';

const meta: Meta<CkEditorControlComponent> = {
  title: 'UI / CK Editor / CK Editor Control',
  component: CkEditorControlComponent,
  argTypes: {
    label: {
      description: 'Label displayed above the editor.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    control: {
      description: 'FormControl bound to the editor value.',
      table: { type: { summary: 'FormControl<string>' }, category: 'State' },
    },
    projectShortcode: {
      description: 'When provided, activates cross-project link validation.',
      control: 'text',
      table: { type: { summary: 'string | null | undefined' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<CkEditorControlComponent>;

export const WithLabel: Story = {
  name: 'Shows label above the editor',
  args: {
    label: 'Description',
    control: new FormControl<string>('', { nonNullable: true }),
    projectShortcode: null,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Description" label is visible', async () => {
      await expect(canvas.getByText('Description')).toBeInTheDocument();
    });
    await step('CKEditor is rendered', async () => {
      await expect(canvasElement.querySelector('ckeditor')).not.toBeNull();
    });
  },
};

export const WithPrefilledContent: Story = {
  name: 'Displays label and pre-filled editor content',
  args: {
    label: 'Abstract',
    control: new FormControl<string>('<p>This is the abstract text.</p>', { nonNullable: true }),
    projectShortcode: null,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Abstract" label is visible', async () => {
      await expect(canvas.getByText('Abstract')).toBeInTheDocument();
    });
  },
};
