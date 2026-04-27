import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { DeleteResourceDialogComponent } from './delete-resource-dialog.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
  }) as any;

const meta: Meta<DeleteResourceDialogComponent> = {
  title: 'Devs / Resource Editor / 2. Header / More Menu / Delete Resource Dialog',
  component: DeleteResourceDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: makeResource() },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: DspApiConnectionToken, useValue: { v2: { res: { deleteResource: () => of({}) } } } },
        { provide: ResourceFetcherService, useValue: { reload: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<DeleteResourceDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows delete confirmation dialog with optional comment',
  play: async ({ canvasElement, step }) => {
    await step('Comment textarea is rendered', async () => {
      const textarea = canvasElement.querySelector('[data-cy="app-delete-resource-dialog-comment"]');
      await expect(textarea).not.toBeNull();
    });
    await step('Confirm delete button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="app-delete-resource-dialog-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
