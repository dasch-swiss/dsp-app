import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { EditResourceLabelDialogComponent } from './edit-resource-label-dialog.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'My Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
  }) as any;

const meta: Meta<EditResourceLabelDialogComponent> = {
  title: 'Devs / Resource Editor / Header / More Menu / Edit Resource Label Dialog',
  component: EditResourceLabelDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: makeResource() },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { res: { getResource: () => of(makeResource()), updateResourceMetadata: () => of({}) } } },
        },
        { provide: ResourceFetcherService, useValue: { reload: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<EditResourceLabelDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows edit label dialog pre-filled with current label',
  play: async ({ canvasElement, step }) => {
    await step('Submit button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="edit-resource-label-submit"]');
      await expect(button).not.toBeNull();
    });
    await step('Current label is pre-filled in the input', async () => {
      const input = canvasElement.querySelector('input') as HTMLInputElement;
      await expect(input?.value).toBe('My Test Resource');
    });
  },
};
