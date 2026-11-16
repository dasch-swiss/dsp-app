import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor } from 'storybook/test';
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

const stackedProps: EditResourceClassDialogProps = { ...dialogProps, layout: 'stacked' };

/** Opens the dialog as Data models 2 does, every language of the label and description in its own field. */
@Component({
  selector: 'app-edit-resource-class-dialog-stacked-launcher',
  template: ``,
})
class EditResourceClassDialogStackedLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(EditResourceClassDialogComponent, { data: stackedProps });
  }
}

const meta: Meta<EditResourceClassDialogLauncherComponent> = {
  title: 'Ontology Editor / 3a. Resource Classes Tab / Resource Class Info / Edit Resource Class Dialog',
  component: EditResourceClassDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<EditResourceClassDialogLauncherComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: MAT_DIALOG_DATA, useValue: dialogProps },
];

export const DefaultView: Story = {
  name: 'Opens 3a. Resource Classes Tab / Resource Class Info / Edit Resource Class Dialog pre-filled with existing class data',
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

export const ShowsEveryLanguageInItsOwnField: Story = {
  name: 'Shows every language of the label and description in its own field, as in Data models 2',
  render: () => ({ template: '<app-edit-resource-class-dialog-stacked-launcher />' }),
  decorators: [
    applicationConfig({ providers: sharedProviders }),
    moduleMetadata({ imports: [EditResourceClassDialogStackedLauncherComponent] }),
  ],
  play: async ({ step }) => {
    const field = (group: string, language: string) =>
      document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-cy="${group}"] [data-cy="multi-language-${language}"]`
      );
    await step('Label and description each show all five languages', async () => {
      await waitFor(() => expect(field('label-input', 'en')).not.toBeNull());
      for (const language of ['en', 'de', 'fr', 'it', 'rm']) {
        await expect(field('label-input', language)).not.toBeNull();
        await expect(field('comment-textarea', language)).not.toBeNull();
      }
    });
    await step('Existing texts fill their language, the others are empty', async () => {
      await expect(field('label-input', 'en')!.value).toBe('Test Class');
      await expect(field('comment-textarea', 'en')!.value).toBe('A test class');
      await expect(field('label-input', 'de')!.value).toBe('');
    });
    await step('Typing a German label keeps the dialog submittable', async () => {
      await userEvent.type(field('label-input', 'de')!, 'Testklasse');
      await expect(field('label-input', 'de')!.value).toBe('Testklasse');
      const submit = document.querySelector<HTMLButtonElement>('[data-cy="submit-button"]');
      await expect(submit!.disabled).toBe(false);
    });
  },
};
