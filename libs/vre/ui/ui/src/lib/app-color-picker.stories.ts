import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ColorPickerComponent } from './app-color-picker.component';

@Component({
  selector: 'story-color-picker-wrapper',
  template: `<app-color-picker [formControl]="control" [hexColor]="'#1565c0'" />`,
  imports: [ColorPickerComponent, ReactiveFormsModule],
})
class ColorPickerWrapperComponent {
  control = new FormControl<string | null>(null);
}

const meta: Meta<ColorPickerWrapperComponent> = {
  title: 'UI / Color Picker / Inline Picker',
  component: ColorPickerWrapperComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<ColorPickerWrapperComponent>;

export const Default: Story = {
  name: 'Renders inline color picker with fieldset border',
  play: async ({ canvasElement, step }) => {
    await step('Color picker fieldset is rendered', async () => {
      await expect(canvasElement.querySelector('fieldset')).not.toBeNull();
    });
    await step('"Select a color" legend is visible', async () => {
      await expect(canvasElement.querySelector('legend')?.textContent?.trim()).toBe('Select a color');
    });
  },
};
