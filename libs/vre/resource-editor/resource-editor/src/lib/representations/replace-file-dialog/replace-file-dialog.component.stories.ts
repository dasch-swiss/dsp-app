import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../resource-fetcher.service';
import { UploadFileService } from '../upload/upload-file.service';
import { ReplaceFileDialogComponent } from './replace-file-dialog.component';

const makeDialogData = () => ({
  representation: 'http://api.knora.org/ontology/knora-api/v2#StillImageRepresentation',
  resource: {
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    attachedToProject: 'http://rdfh.ch/projects/test',
  },
  title: 'Replace Image',
});

@Component({
  selector: 'app-replace-file-dialog-launcher',
  template: ``,
})
class ReplaceFileDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(ReplaceFileDialogComponent, { data: makeDialogData() });
  }
}

const meta: Meta<ReplaceFileDialogLauncherComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / Replace File Dialog',
  component: ReplaceFileDialogLauncherComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: ResourceFetcherService, useValue: { projectShortcode$: of('test'), reload: () => {} } },
        { provide: DspApiConnectionToken, useValue: { v2: { values: { updateValue: () => of({}) } } } },
        { provide: UploadFileService, useValue: { upload: () => {}, getFileInfo: () => {} } },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ReplaceFileDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows replace file dialog with upload form',
  play: async ({ step }) => {
    await step('Dialog content is rendered', async () => {
      const content = document.querySelector('mat-dialog-content');
      await expect(content).not.toBeNull();
    });
  },
};
