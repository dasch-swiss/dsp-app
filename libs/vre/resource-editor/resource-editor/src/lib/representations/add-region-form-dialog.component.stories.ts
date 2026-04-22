import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { AddRegionFormDialogComponent, AddRegionFormDialogProps } from './add-region-form-dialog.component';

const dialogData: AddRegionFormDialogProps = {
  resourceIri: 'http://rdfh.ch/resource/1',
  projectShortcode: '0001',
};

const meta: Meta<AddRegionFormDialogComponent> = {
  title: 'Devs / Resource Editor / Representation / Add Region Form Dialog',
  component: AddRegionFormDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }),
  ],
  argTypes: {},
};
export default meta;
type Story = StoryObj<AddRegionFormDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows annotation form with label, comment and color fields',
  play: async ({ canvasElement, step }) => {
    await step('Dialog header is rendered', async () => {
      const header = canvasElement.querySelector('app-dialog-header');
      await expect(header).not.toBeNull();
    });
    await step('Submit button is disabled when form is empty', async () => {
      const submitButton = Array.from(canvasElement.querySelectorAll('button')).find(b =>
        b.textContent?.toLowerCase().includes('submit')
      );
      await expect(submitButton?.hasAttribute('disabled')).toBe(true);
    });
  },
};
