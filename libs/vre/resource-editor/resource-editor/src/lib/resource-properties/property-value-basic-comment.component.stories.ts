import { FormControl } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { PropertyValueBasicCommentComponent } from './property-value-basic-comment.component';

const meta: Meta<PropertyValueBasicCommentComponent> = {
  title:
    'Devs / Resource Editor / 4. Properties / Properties Display / Property Value / Properties Display / Property Value Basic Comment',
  component: PropertyValueBasicCommentComponent,
  argTypes: {
    control: {
      description: 'FormControl bound to the comment textarea.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueBasicCommentComponent>;

export const Empty: Story = {
  name: 'Shows empty comment textarea',
  args: {
    control: new FormControl<string | null>(''),
  },
  play: async ({ canvasElement, step }) => {
    await step('Comment textarea is rendered', async () => {
      const textarea = canvasElement.querySelector('[data-cy="comment-textarea"]');
      await expect(textarea).not.toBeNull();
    });
  },
};

export const WithComment: Story = {
  name: 'Shows pre-filled comment text',
  args: {
    control: new FormControl<string | null>('This is an existing comment.'),
  },
  play: async ({ canvasElement, step }) => {
    await step('Textarea contains the existing comment', async () => {
      const textarea = canvasElement.querySelector('[data-cy="comment-textarea"]') as HTMLTextAreaElement;
      await expect(textarea.value).toBe('This is an existing comment.');
    });
  },
};

export const Disabled: Story = {
  name: 'Shows lock icon when comment is disabled',
  args: {
    control: (() => {
      const c = new FormControl<string | null>('');
      c.disable();
      return c;
    })(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Lock icon is rendered when control is disabled', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('lock');
    });
  },
};
