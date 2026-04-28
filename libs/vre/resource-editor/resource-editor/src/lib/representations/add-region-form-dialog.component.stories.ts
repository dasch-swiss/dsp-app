import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { AddRegionFormDialogComponent, AddRegionFormDialogProps } from './add-region-form-dialog.component';

const dialogData: AddRegionFormDialogProps = {
  resourceIri: 'http://rdfh.ch/resource/1',
  projectShortcode: '0001',
};

@Component({
  selector: 'app-add-region-form-dialog-launcher',
  template: ``,
})
class AddRegionFormDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(AddRegionFormDialogComponent, { data: dialogData });
  }
}

const meta: Meta<AddRegionFormDialogLauncherComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / Add Region Form Dialog',
  component: AddRegionFormDialogLauncherComponent,
  decorators: [applicationConfig({ providers: [] })],
  argTypes: {},
};
export default meta;
type Story = StoryObj<AddRegionFormDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows annotation form with label, comment and color fields',
  play: async ({ step }) => {
    await step('Dialog header is rendered', async () => {
      const header = document.querySelector('app-dialog-header');
      await expect(header).not.toBeNull();
    });
    await step('Submit button is disabled when form is empty', async () => {
      const submitButton = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.toLowerCase().includes('submit')
      );
      await expect(submitButton?.hasAttribute('disabled')).toBe(true);
    });
  },
};
