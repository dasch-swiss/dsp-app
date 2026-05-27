import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { CreateOntologyFormDialogComponent } from './create-ontology-form-dialog.component';

@Component({
  selector: 'app-create-ontology-form-dialog-launcher',
  template: ``,
})
class CreateOntologyFormDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(CreateOntologyFormDialogComponent);
  }
}

const meta: Meta<CreateOntologyFormDialogLauncherComponent> = {
  title: 'Pages / Data Models / Create Ontology Form Dialog',
  component: CreateOntologyFormDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<CreateOntologyFormDialogLauncherComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  {
    provide: DspApiConnectionToken,
    useValue: { v2: { onto: { createOntology: () => of({}) } } } as unknown as Partial<KnoraApiConnection>,
  },
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
];

export const DefaultView: Story = {
  name: 'Opens create ontology dialog with name, label and comment fields',
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
