import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultProperties } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
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
  selector: 'app-create-property-dialog-launcher',
  template: ``,
})
class CreatePropertyDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(EditPropertyFormDialogComponent, { data: createDialogData });
  }
}

@Component({
  selector: 'app-edit-property-dialog-launcher',
  template: ``,
})
class EditPropertyDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(EditPropertyFormDialogComponent, { data: editDialogData });
  }
}

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
];

const meta: Meta<CreatePropertyDialogLauncherComponent> = {
  title: 'Ontology Editor / 3b. Properties Tab / Edit Property Form Dialog',
  component: CreatePropertyDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<CreatePropertyDialogLauncherComponent>;

export const CreatePropertyDialog: Story = {
  name: 'Opens create property dialog with type selector and name field',
  decorators: [
    applicationConfig({
      providers: [...sharedProviders, { provide: MAT_DIALOG_DATA, useValue: createDialogData }],
    }),
  ],
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

export const EditPropertyDialog: Story = {
  storyName: 'Opens edit property dialog pre-filled with existing property data',
  decorators: [
    applicationConfig({
      providers: [...sharedProviders, { provide: MAT_DIALOG_DATA, useValue: editDialogData }],
    }),
  ],
  render: () => ({
    props: {},
    template: `<app-edit-property-dialog-launcher></app-edit-property-dialog-launcher>`,
    imports: [EditPropertyDialogLauncherComponent],
  }),
  play: async ({ step }) => {
    await step('Dialog is rendered', async () => {
      const container = document.querySelector('mat-dialog-container');
      await expect(container).not.toBeNull();
    });
  },
};
