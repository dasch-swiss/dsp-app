import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultResourceClasses } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { CreateResourceClassDialogComponent } from './create-resource-class-dialog.component';

const defaultClass = DefaultResourceClasses.data[0];

@Component({
  selector: 'app-create-resource-class-dialog-launcher',
  template: ``,
})
class CreateResourceClassDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(CreateResourceClassDialogComponent, { data: defaultClass });
  }
}

const meta: Meta<CreateResourceClassDialogLauncherComponent> = {
  title: 'Ontology Editor / 3a. Resource Classes Tab / Create Resource Class Dialog',
  component: CreateResourceClassDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<CreateResourceClassDialogLauncherComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: MAT_DIALOG_DATA, useValue: defaultClass },
];

export const DefaultView: Story = {
  name: 'Opens dialog with name, label and comment fields',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ step }) => {
    await step('Dialog is rendered', async () => {
      const container = document.querySelector('mat-dialog-container');
      await expect(container).not.toBeNull();
    });
    await step('Name input is present', async () => {
      const nameInput = document.querySelector('[data-cy="name-input"]');
      await expect(nameInput).not.toBeNull();
    });
    await step('Submit button is present', async () => {
      const submitButton = document.querySelector('[data-cy="submit-button"]');
      await expect(submitButton).not.toBeNull();
    });
  },
};
