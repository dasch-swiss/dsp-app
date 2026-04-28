import { MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ClosingDialogComponent } from './closing-dialog.component';

const meta: Meta<ClosingDialogComponent> = {
  title: 'Resource Editor / 2. Header / Closing Dialog',
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
