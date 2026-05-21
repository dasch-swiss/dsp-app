import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { ClosingDialogComponent } from './closing-dialog.component';

@Component({
  selector: 'app-closing-dialog-story-wrapper',
  template: `
    <app-closing-dialog>
      <p>This is projected content inside the dialog.</p>
    </app-closing-dialog>
  `,
  imports: [ClosingDialogComponent],
})
class ClosingDialogStoryWrapperComponent {}

const meta: Meta<ClosingDialogStoryWrapperComponent> = {
  title: 'Pages / Project / Description / Closing Dialog',
  component: ClosingDialogStoryWrapperComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<ClosingDialogStoryWrapperComponent>;

export const WithContent: Story = {
  name: 'Shows projected content and a close button',
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialogRef, useValue: { close: () => {} } }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Projected content is visible', async () => {
      await expect(canvas.getByText('This is projected content inside the dialog.')).toBeInTheDocument();
    });
    await step('Close button is present', async () => {
      await expect(canvas.getByRole('button')).toBeInTheDocument();
    });
  },
};

export const CloseButtonClick: Story = {
  name: 'Close button calls dialogRef.close when clicked',
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialogRef, useValue: { close: () => {} } }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the close button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Component remains in DOM after close', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
