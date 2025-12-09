import { Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DeleteResource, KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';

@Component({
  selector: 'app-delete-resource-dialog',
  template: ` <app-dialog-header
      [title]="'resourceEditor.propertiesDisplay.deleteResource.title' | translate"
      [subtitle]="data.label" />
    <mat-dialog-content class="form-content">
      <mat-form-field class="large-field">
        <mat-label>{{ 'resourceEditor.propertiesDisplay.deleteResource.label' | translate }}</mat-label>
        <textarea
          data-cy="app-delete-resource-dialog-comment"
          matInput
          type="text"
          [(ngModel)]="comment"
          [placeholder]="'resourceEditor.propertiesDisplay.deleteResource.placeholder' | translate"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button color="primary" mat-dialog-close class="cancel-button center">
        {{ 'resourceEditor.propertiesDisplay.deleteResource.noKeep' | translate }}
      </button>
      <span class="fill-remaining-space"></span>
      <button
        data-cy="app-delete-resource-dialog-button"
        mat-button
        mat-raised-button
        [color]="'warn'"
        class="confirm-button center"
        (click)="submit()">
        {{ 'resourceEditor.propertiesDisplay.deleteResource.yesDelete' | translate }}
      </button>
    </mat-dialog-actions>`,
  standalone: true,
  imports: [
    DialogHeaderComponent,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
  ],
})
export class DeleteResourceDialogComponent {
  comment: string | undefined;

  private readonly _translateService = inject(TranslateService);

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: ReadResource,
    private _dialogRef: MatDialogRef<DeleteResourceDialogComponent>,
    private _resourceFetcherService: ResourceFetcherService
  ) {}

  submit() {
    const payload = new DeleteResource();
    payload.id = this.data.id;
    payload.type = this.data.type;
    payload.deleteComment = this.comment ?? undefined;
    payload.lastModificationDate = this.data.lastModificationDate;
    this._dspApiConnection.v2.res.deleteResource(payload).subscribe(() => {
      this._resourceFetcherService.reload();
      this._dialogRef.close();
    });
  }
}
