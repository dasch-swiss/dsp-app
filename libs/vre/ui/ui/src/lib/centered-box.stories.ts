import { Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { CenteredBoxComponent } from './centered-box.component';

@Component({
  selector: 'story-centered-box-wrapper',
  template: `
    <app-centered-box>
      <p>Centered content goes here</p>
    </app-centered-box>
  `,
  imports: [CenteredBoxComponent],
})
class CenteredBoxWrapperComponent {}

const meta: Meta<CenteredBoxWrapperComponent> = {
  title: 'UI / Centered Box / Layout',
  component: CenteredBoxWrapperComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<CenteredBoxWrapperComponent>;

export const Default: Story = {
  name: 'Renders projected content centered on the page',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Projected content is visible', async () => {
      await expect(canvas.getByText('Centered content goes here')).toBeInTheDocument();
    });
  },
};
