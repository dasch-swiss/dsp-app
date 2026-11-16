import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';
import { EditListItemDialogComponent, EditListItemDialogProps } from './edit-list-item-dialog.component';

const dialogProps: EditListItemDialogProps = {
  nodeIri: 'http://rdfh.ch/lists/0001/mathematics',
  projectIri: 'http://rdfh.ch/projects/0001',
  formData: {
    labels: [
      { language: 'en', value: 'Mathematics' },
      { language: 'de', value: 'Mathematik' },
    ],
    comments: [{ language: 'en', value: 'Pure and applied mathematics' }],
  },
};

@Component({
  selector: 'app-edit-list-item-dialog-launcher',
  template: ``,
})
class EditListItemDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  private _data = inject<EditListItemDialogProps>(MAT_DIALOG_DATA);
  ngOnInit() {
    this._dialog.open(EditListItemDialogComponent, { data: this._data });
  }
}

const meta: Meta<EditListItemDialogLauncherComponent> = {
  title: 'Ontology Editor / Lists / Edit List Item Dialog',
  component: EditListItemDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<EditListItemDialogLauncherComponent>;

const providers = (data: EditListItemDialogProps) => [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  { provide: ListApiService, useValue: { updateChildNode: () => of({}), deleteChildComments: () => of({}) } },
  { provide: MAT_DIALOG_DATA, useValue: data },
];

const field = (group: string, language: string) =>
  document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[data-cy="${group}"] [data-cy="multi-language-${language}"]`
  );

export const ShowsOneLanguageAtATimeByDefault: Story = {
  name: 'Shows the label and description one language at a time, with a language switcher',
  decorators: [applicationConfig({ providers: providers(dialogProps) })],
  play: async ({ step }) => {
    await step('Dialog is rendered with the language switcher fields', async () => {
      await waitFor(() => expect(document.querySelector('app-multi-language-input')).not.toBeNull());
      await expect(document.querySelector('app-multi-language-fields')).toBeNull();
    });
  },
};

export const ShowsEveryLanguageInItsOwnField: Story = {
  name: 'Shows every language of the label and description in its own field, as in Data models 2',
  decorators: [applicationConfig({ providers: providers({ ...dialogProps, layout: 'stacked' }) })],
  play: async ({ step }) => {
    await step('Label and description each show all five languages', async () => {
      await waitFor(() => expect(field('label-input', 'en')).not.toBeNull());
      for (const language of ['en', 'de', 'fr', 'it', 'rm']) {
        await expect(field('label-input', language)).not.toBeNull();
        await expect(field('comment-textarea', language)).not.toBeNull();
      }
    });
    await step('Existing texts fill their language, the others are empty', async () => {
      await expect(field('label-input', 'en')!.value).toBe('Mathematics');
      await expect(field('label-input', 'de')!.value).toBe('Mathematik');
      await expect(field('comment-textarea', 'en')!.value).toBe('Pure and applied mathematics');
      await expect(field('comment-textarea', 'de')!.value).toBe('');
    });
    await step('Typing a French label keeps the dialog submittable', async () => {
      await userEvent.type(field('label-input', 'fr')!, 'Mathématiques');
      await expect(field('label-input', 'fr')!.value).toBe('Mathématiques');
      const submit = Array.from(
        document.querySelectorAll<HTMLButtonElement>('mat-dialog-actions button, [mat-dialog-actions] button')
      ).pop();
      await expect(submit!.disabled).toBe(false);
    });
  },
};
