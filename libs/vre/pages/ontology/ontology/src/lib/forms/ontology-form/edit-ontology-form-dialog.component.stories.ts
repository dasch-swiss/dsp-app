import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { EditOntologyFormDialogComponent } from './edit-ontology-form-dialog.component';
import { UpdateOntologyData } from './ontology-form.type';

const dialogData: UpdateOntologyData = {
  id: 'http://0.0.0.0:3333/ontology/0001/test/v2',
  label: 'Test Ontology',
  comment: 'Describes test data',
};

@Component({
  selector: 'app-edit-ontology-form-dialog-launcher',
  template: ``,
})
class EditOntologyFormDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(EditOntologyFormDialogComponent, { data: dialogData });
  }
}

const meta: Meta<EditOntologyFormDialogLauncherComponent> = {
  title: 'Ontology Editor / 1. Header / Edit Ontology Form Dialog',
  component: EditOntologyFormDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<EditOntologyFormDialogLauncherComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: MAT_DIALOG_DATA, useValue: dialogData },
];

export const DefaultView: Story = {
  name: 'Opens edit ontology dialog pre-filled with existing data',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ step }) => {
    await step('Dialog is rendered', async () => {
      const container = document.querySelector('mat-dialog-container');
      await expect(container).not.toBeNull();
    });
    await step('Submit button is present', async () => {
      const submitButton = document.querySelector('[data-cy="submit-button"]');
      await expect(submitButton).not.toBeNull();
    });
  },
};
