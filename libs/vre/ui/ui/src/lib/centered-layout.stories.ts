import { Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { CenteredLayoutComponent } from './centered-layout.component';

@Component({
  selector: 'story-centered-layout-wrapper',
  template: `
    <app-centered-layout>
      <p>Page content with max-width centering</p>
    </app-centered-layout>
  `,
  imports: [CenteredLayoutComponent],
})
class CenteredLayoutWrapperComponent {}

const meta: Meta<CenteredLayoutWrapperComponent> = {
  title: 'UI / Centered Layout / Layout',
  component: CenteredLayoutWrapperComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<CenteredLayoutWrapperComponent>;

export const Default: Story = {
  name: 'Renders projected content inside a centered content container',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Projected content is visible', async () => {
      await expect(canvas.getByText('Page content with max-width centering')).toBeInTheDocument();
    });
  },
};
