import { AsyncPipe } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import {
  KnoraApiConnection,
  ReadResource,
  UpdateExternalStillImageFileValue,
  UpdateFileValue,
  UpdateResource,
  UpdateStillImageFileValue,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CreateResourceFormFileComponent } from '../../resource-creator/create-resource-form-file.component';
import { FileForm } from '../file-form.type';
import { FileRepresentationType } from '../file-representation.type';
import { fileValueMapping } from '../file-value-mapping';
import { ResourceFetcherService } from '../resource-fetcher.service';

export interface ReplaceFileDialogProps {
  representation: FileRepresentationType;
  resource: ReadResource;
  title: string;
}

@Component({
  selector: 'app-replace-file-dialog',
  template: `
    <app-dialog-header [subtitle]="data.title" [title]="'resourceEditor.representations.replaceFile' | translate" />
    <mat-dialog-content>
      <div class="warning">
        <div class="container">
          <div class="icon">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="message">
            {{ 'resourceEditor.representations.replaceFileDialog.willBeReplaced' | translate }}
          </div>
        </div>
      </div>

      @if (resourceFetcher.projectShortcode$ | async; as projectShortcode) {
        <app-create-resource-form-file
          [fileRepresentation]="data.representation"
          (afterFormCreated)="form = $event"
          [projectShortcode]="projectShortcode" />
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" data-cy="replace-file-cancel-button" (click)="dialogRef.close()">
        {{ 'ui.common.actions.cancel' | translate }}
      </button>
      <button
        mat-raised-button
        type="submit"
        data-cy="replace-file-submit-button"
        [color]="'primary'"
        (click)="replaceFile()">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./replace-file-dialog.component.scss'],
  imports: [
    DialogHeaderComponent,
    MatDialogContent,
    MatIcon,
    AsyncPipe,
    CreateResourceFormFileComponent,
    MatDialogActions,
    MatButton,
    TranslatePipe,
  ],
})
export class ReplaceFileDialogComponent {
  form!: FileForm;

  readonly _translateService = inject(TranslateService);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ReplaceFileDialogProps,
    public dialogRef: MatDialogRef<ReplaceFileDialogComponent>,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    public resourceFetcher: ResourceFetcherService
  ) {}

  replaceFile() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    let uploadedFile = fileValueMapping.get(this.data.representation)!.update();

    if (uploadedFile instanceof UpdateStillImageFileValue && formValue.link!.startsWith('http')) {
      uploadedFile = new UpdateExternalStillImageFileValue();
      (uploadedFile as UpdateExternalStillImageFileValue).externalUrl = formValue.link!;
    } else {
      uploadedFile.filename = formValue.link!;
    }

    uploadedFile.id = this.data.resource.properties[this.data.representation][0].id;
    uploadedFile.copyrightHolder = formValue.legal.copyrightHolder!;
    uploadedFile.license = formValue.legal.license!;
    uploadedFile.authorship = formValue.legal.authorship!;

    const updateRes = new UpdateResource<UpdateFileValue>();
    updateRes.id = this.data.resource.id;
    updateRes.type = this.data.resource.type;
    updateRes.property = this.data.representation;

    updateRes.value = uploadedFile;

    this._dspApiConnection.v2.values.updateValue(updateRes).subscribe(() => {
      this.resourceFetcher.reload();
      this.dialogRef.close();
    });
  }
}
