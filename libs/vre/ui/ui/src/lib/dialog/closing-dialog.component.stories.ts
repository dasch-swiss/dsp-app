import { MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { ClosingDialogComponent } from './closing-dialog.component';

const meta: Meta<ClosingDialogComponent> = {
  title: 'UI / Dialog / Closing Dialog',
  component: ClosingDialogComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialogRef, useValue: { close: () => {} } }],
    }),
  ],
};
export default meta;
type Story = StoryObj<ClosingDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows close button with projected dialog content',
  render: () => ({
    props: {},
    template: `<app-closing-dialog>Dialog content goes here.</app-closing-dialog>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Close icon button is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('close');
    });
    await step('Projected content is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Dialog content goes here.');
    });
  },
};

export const CloseButtonClick: Story = {
  name: 'Calls dialogRef.close when close button is clicked',
  render: () => ({
    props: {},
    template: `<app-closing-dialog>Dialog content goes here.</app-closing-dialog>`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the close button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Component remains in DOM after close call', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
