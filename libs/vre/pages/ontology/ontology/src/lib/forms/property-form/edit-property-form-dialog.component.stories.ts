import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultProperties } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { EditPropertyFormDialogComponent } from './edit-property-form-dialog.component';
import { CreatePropertyDialogData, EditPropertyDialogData } from './property-form.type';

const textPropType = DefaultProperties.data.find(g => g.group === 'Text')!.elements[0];

const createDialogData: CreatePropertyDialogData = {
  propType: textPropType,
};

const editDialogData: EditPropertyDialogData = {
  id: 'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
  propType: textPropType,
  name: 'hasTitle',
  label: [{ language: 'en', value: 'Title' }],
  comment: [{ language: 'en', value: 'The title of a resource' }],
  guiElement: Constants.GuiSimpleText,
};

@Component({
  selector: 'app-property-dialog-launcher',
  template: ``,
})
class PropertyDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  private _data = inject<CreatePropertyDialogData | EditPropertyDialogData>(MAT_DIALOG_DATA);
  ngOnInit() {
    this._dialog.open(EditPropertyFormDialogComponent, { data: this._data });
  }
}

const meta: Meta<PropertyDialogLauncherComponent> = {
  title: 'Ontology Editor / 3b. Properties Tab / Edit Property Form Dialog',
  component: PropertyDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<PropertyDialogLauncherComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
];

export const CreatePropertyDialog: Story = {
  name: 'Opens create property dialog with type selector and name field',
  decorators: [
    applicationConfig({
      providers: [...sharedProviders, { provide: MAT_DIALOG_DATA, useValue: createDialogData }],
    }),
  ],
  play: async ({ step }) => {
    await step('Dialog is rendered', async () => {
      await waitFor(() => {
        const container = document.querySelector('mat-dialog-container');
        expect(container).not.toBeNull();
      });
    });
    await step('Submit button is present', async () => {
      await waitFor(() => {
        const submitButton = document.querySelector('[data-cy="submit-button"]');
        expect(submitButton).not.toBeNull();
      });
    });
  },
};

export const EditPropertyDialog: Story = {
  name: 'Opens edit property dialog pre-filled with existing property data',
  decorators: [
    applicationConfig({
      providers: [...sharedProviders, { provide: MAT_DIALOG_DATA, useValue: editDialogData }],
    }),
  ],
  play: async ({ step }) => {
    await step('Dialog is rendered', async () => {
      await waitFor(() => {
        const container = document.querySelector('mat-dialog-container');
        expect(container).not.toBeNull();
      });
    });
  },
};
