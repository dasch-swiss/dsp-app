import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { Component } from '@angular/core';
import { MatListItem } from '@angular/material/list';
import { ClickableListCardComponent } from './clickable-list-card.component';

@Component({
  selector: 'story-clickable-list-card-wrapper',
  template: `
    <app-clickable-list-card>
      <mat-list-item>First item</mat-list-item>
      <mat-list-item>Second item</mat-list-item>
      <mat-list-item>Third item</mat-list-item>
    </app-clickable-list-card>
  `,
  imports: [ClickableListCardComponent, MatListItem],
})
class ClickableListCardWrapperComponent {}

const meta: Meta<ClickableListCardWrapperComponent> = {
  title: 'UI / Clickable List Card / Card',
  component: ClickableListCardWrapperComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<ClickableListCardWrapperComponent>;

export const Default: Story = {
  name: 'Renders list items inside an outlined card',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"First item" is visible', async () => {
      await expect(canvas.getByText('First item')).toBeInTheDocument();
    });
    await step('"Third item" is visible', async () => {
      await expect(canvas.getByText('Third item')).toBeInTheDocument();
    });
  },
};
