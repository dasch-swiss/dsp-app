import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { NullableEditorComponent } from './nullable-editor.component';

const metaWithValue = new FormControl('some value');

const meta: Meta<NullableEditorComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Template Switcher / Nullable Editor',
  component: NullableEditorComponent,
  argTypes: {
    defaultValue: {
      description: 'The value to set when the user clicks the add button.',
      table: { type: { summary: 'unknown' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<NullableEditorComponent>;

export const Empty: Story = {
  name: 'Shows add button when value is null',
  args: {
    defaultValue: 'default',
  },
  play: async ({ canvasElement, step }) => {
    await step('Add button is rendered when value is null', async () => {
      const button = canvasElement.querySelector('[data-cy="add-value-button"]');
      await expect(button).not.toBeNull();
    });
    await step('Add button shows add_box icon', async () => {
      const icon = canvasElement.querySelector('[data-cy="add-value-button"] mat-icon');
      await expect(icon?.textContent?.trim()).toBe('add_box');
    });
  },
};

export const WithValue: Story = {
  name: 'Shows cancel button when a value is set',
  render: args => ({
    props: { ...args, control: metaWithValue },
    template: `
      <app-nullable-editor [defaultValue]="defaultValue" [formControl]="control">
        <span>Current value</span>
      </app-nullable-editor>
    `,
    moduleMetadata: { imports: [NullableEditorComponent, ReactiveFormsModule] },
  }),
  args: {
    defaultValue: 'default',
  },
  play: async ({ canvasElement, step }) => {
    await step('Cancel button shows cancel icon when value is set', async () => {
      const icon = canvasElement.querySelector('[data-cy="add-value-button"] mat-icon');
      await expect(icon?.textContent?.trim()).toBe('cancel');
    });
  },
};
