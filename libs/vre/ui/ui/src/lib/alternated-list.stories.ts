import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { Component } from '@angular/core';
import { AlternatedListComponent } from './alternated-list.component';

@Component({
  selector: 'story-alternated-list-wrapper',
  template: `
    <app-alternated-list>
      <div>Item One</div>
      <div>Item Two</div>
      <div>Item Three</div>
      <div>Item Four</div>
      <div>Item Five</div>
    </app-alternated-list>
  `,
  imports: [AlternatedListComponent],
})
class AlternatedListWrapperComponent {}

const meta: Meta<AlternatedListWrapperComponent> = {
  title: 'UI / Alternated List / List',
  component: AlternatedListWrapperComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<AlternatedListWrapperComponent>;

export const Default: Story = {
  name: 'Renders items with alternating row backgrounds',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Item One" is visible', async () => {
      await expect(canvas.getByText('Item One')).toBeInTheDocument();
    });
    await step('"Item Three" is visible', async () => {
      await expect(canvas.getByText('Item Three')).toBeInTheDocument();
    });
  },
};
