import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { EditResourceClassDialogComponent, EditResourceClassDialogProps } from './edit-resource-class-dialog.component';

const dialogProps: EditResourceClassDialogProps = {
  labels: [{ language: 'en', value: 'Test Class' }],
  data: {
    id: 'http://0.0.0.0:3333/ontology/0001/test/v2#TestClass',
    labels: [{ language: 'en', value: 'Test Class' }],
    comments: [{ language: 'en', value: 'A test class' }],
  },
};

@Component({
  selector: 'app-edit-resource-class-dialog-launcher',
  template: ``,
})
class EditResourceClassDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(EditResourceClassDialogComponent, { data: dialogProps });
  }
}

const meta: Meta<EditResourceClassDialogLauncherComponent> = {
  title: 'Ontology / Forms / Edit Resource Class Dialog',
  component: EditResourceClassDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<EditResourceClassDialogLauncherComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...TranslateModule.forRoot().providers!,
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: MAT_DIALOG_DATA, useValue: dialogProps },
];

export const DefaultView: Story = {
  name: 'Opens edit resource class dialog pre-filled with existing class data',
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
