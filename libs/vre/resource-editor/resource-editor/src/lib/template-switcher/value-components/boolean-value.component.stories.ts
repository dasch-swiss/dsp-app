import { FormControl } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { BooleanValueComponent } from './boolean-value.component';

const meta: Meta<BooleanValueComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Properties Display / Template Switcher / Boolean Value',
  component: BooleanValueComponent,
  argTypes: {
    control: {
      description: 'FormControl bound to the boolean toggle.',
      table: { type: { summary: 'FormControl<boolean | null>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<BooleanValueComponent>;

export const Unchecked: Story = {
  name: 'Shows unchecked toggle when value is false',
  args: {
    control: new FormControl<boolean | null>(false),
  },
  play: async ({ canvasElement, step }) => {
    await step('Toggle is rendered', async () => {
      const toggle = canvasElement.querySelector('[data-cy="bool-toggle"]');
      await expect(toggle).not.toBeNull();
    });
  },
};

export const Checked: Story = {
  name: 'Shows checked toggle when value is true',
  args: {
    control: new FormControl<boolean | null>(true),
  },
  play: async ({ canvasElement, step }) => {
    await step('Toggle is rendered in checked state', async () => {
      const toggle = canvasElement.querySelector('[data-cy="bool-toggle"]');
      await expect(toggle).not.toBeNull();
    });
  },
};

export const NullValue: Story = {
  name: 'Shows add button when value is null',
  args: {
    control: new FormControl<boolean | null>(null),
  },
  play: async ({ canvasElement, step }) => {
    await step('Toggle is hidden and add button is shown when null', async () => {
      const toggle = canvasElement.querySelector('[data-cy="bool-toggle"]');
      await expect(toggle).toBeNull();
    });
  },
};
