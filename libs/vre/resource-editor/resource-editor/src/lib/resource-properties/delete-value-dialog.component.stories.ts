import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { DeleteValueDialogComponent } from './delete-value-dialog.component';
import { PropertyValueService } from './property-value.service';

const propertyValueServiceStub: Partial<PropertyValueService> = {
  propertyDefinition: {
    label: 'Description',
    id: 'http://example.org/prop',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
  } as any,
  editModeData: {
    resource: { id: 'http://rdfh.ch/resource/1', type: 'http://example.org/Thing' } as any,
    values: [{ id: 'http://rdfh.ch/values/1', type: 'http://api.knora.org/ontology/knora-api/v2#TextValue' } as any],
  },
};

const dspApiConnectionStub = {
  v2: { values: { deleteValue: () => of({}) } },
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  reload: () => {},
};

const meta: Meta<DeleteValueDialogComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Properties Display / Property Value / Delete Value Dialog',
  component: DeleteValueDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { index: 0 } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: PropertyValueService, useValue: propertyValueServiceStub },
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<DeleteValueDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows delete confirmation dialog with optional comment',
  play: async ({ canvasElement, step }) => {
    await step('Comment textarea is rendered', async () => {
      const textarea = canvasElement.querySelector('[data-cy="delete-comment"]');
      await expect(textarea).not.toBeNull();
    });
    await step('Confirm delete button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="confirm-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
