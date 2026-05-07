import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representation/resource-fetcher.service';
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

@Component({
  selector: 'app-delete-value-dialog-launcher',
  template: ``,
})
class DeleteValueDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(DeleteValueDialogComponent, { data: { index: 0 } });
  }
}

const meta: Meta<DeleteValueDialogLauncherComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Property Value / Delete Value Dialog',
  component: DeleteValueDialogLauncherComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: propertyValueServiceStub },
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<DeleteValueDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows delete confirmation dialog with optional comment',
  play: async ({ step }) => {
    await step('Comment textarea is rendered', async () => {
      const textarea = document.querySelector('[data-cy="delete-comment"]');
      await expect(textarea).not.toBeNull();
    });

    await step('Confirm delete button is rendered', async () => {
      const button = document.querySelector('[data-cy="confirm-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
