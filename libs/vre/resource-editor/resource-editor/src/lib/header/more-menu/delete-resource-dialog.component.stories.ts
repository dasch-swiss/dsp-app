import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../../representations/resource-fetcher.service';
import { DeleteResourceDialogComponent } from './delete-resource-dialog.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
  }) as any;

@Component({
  selector: 'app-delete-resource-dialog-launcher',
  template: ``,
})
class DeleteResourceDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(DeleteResourceDialogComponent, { data: makeResource() });
  }
}

const meta: Meta<DeleteResourceDialogLauncherComponent> = {
  title: 'Resource Editor / 2. Header / More Menu / Delete Resource Dialog',
  component: DeleteResourceDialogLauncherComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: DspApiConnectionToken, useValue: { v2: { res: { deleteResource: () => of({}) } } } },
        { provide: ResourceFetcherService, useValue: { reload: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<DeleteResourceDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows delete confirmation dialog with optional comment',
  play: async ({ step }) => {
    await step('Comment textarea is rendered', async () => {
      const textarea = document.querySelector('[data-cy="app-delete-resource-dialog-comment"]');
      await expect(textarea).not.toBeNull();
    });
    await step('Confirm delete button is rendered', async () => {
      const button = document.querySelector('[data-cy="app-delete-resource-dialog-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
