import { FormControl } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CkEditorComponent } from './ck-editor.component';

const meta: Meta<CkEditorComponent> = {
  title: 'UI / CK Editor / Rich Text Editor',
  component: CkEditorComponent,
  argTypes: {
    control: {
      description: 'FormControl holding the HTML string value of the editor.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
    projectShortcode: {
      description: 'When provided, activates cross-project link validation for this project.',
      control: 'text',
      table: { type: { summary: 'string | undefined' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<CkEditorComponent>;

export const Empty: Story = {
  name: 'Shows empty editor ready for input',
  args: {
    control: new FormControl<string | null>(null),
  },
  play: async ({ canvasElement, step }) => {
    await step('CKEditor container is rendered', async () => {
      await expect(canvasElement.querySelector('ckeditor')).not.toBeNull();
    });
  },
};

export const WithPrefilledContent: Story = {
  name: 'Displays pre-filled HTML content',
  args: {
    control: new FormControl<string | null>('<p>Hello <strong>world</strong></p>'),
  },
  play: async ({ canvasElement, step }) => {
    await step('CKEditor container is rendered', async () => {
      await expect(canvasElement.querySelector('ckeditor')).not.toBeNull();
    });
  },
};
