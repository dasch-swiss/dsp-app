import { FormControl } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ColorValueComponent } from './color-value.component';

const meta: Meta<ColorValueComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Color Value',
  component: ColorValueComponent,
  argTypes: {
    control: {
      description: 'FormControl bound to the hex color string.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ColorValueComponent>;

export const WithColor: Story = {
  name: 'Shows color picker with an initial color value',
  args: {
    control: new FormControl<string | null>('#3399ff'),
  },
  play: async ({ canvasElement, step }) => {
    await step('Color picker is rendered', async () => {
      const picker = canvasElement.querySelector('app-color-picker');
      await expect(picker).not.toBeNull();
    });
  },
};

export const NullValue: Story = {
  name: 'Shows add button when value is null',
  args: {
    control: new FormControl<string | null>(null),
  },
  play: async ({ canvasElement, step }) => {
    await step('Color picker is hidden and add button is shown when null', async () => {
      const picker = canvasElement.querySelector('app-color-picker');
      await expect(picker).toBeNull();
    });
  },
};
