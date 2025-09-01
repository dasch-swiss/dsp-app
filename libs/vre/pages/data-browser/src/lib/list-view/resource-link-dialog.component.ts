import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  Constants,
  CreateLinkValue,
  CreateResource,
  CreateTextValueAsString,
  KnoraApiConnection,
  ReadResource,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { Store } from '@ngxs/store';
import { finalize, Subject } from 'rxjs';

export interface ResourceLinkDialogProps {
  resources: ReadResource[];
  projectUuid: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-link-dialog',
  template: `
    <app-dialog-header [title]="title" [subtitle]="'Link resources'" />

    <mat-dialog-content>
      <form [formGroup]="form">
        <app-common-input [control]="form.controls.label" label="Collection labels" />

        <app-ck-editor-control [control]="form.controls.comment" [label]="'Comment'" />

        <div class="resource-container">
          <p>The following resources will be connected:</p>
          <ul>
            <li *ngFor="let res of data.resources">{{ res.label }}</li>
          </ul>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">{{ 'ui.form.action.cancel' | translate }}</button>

      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        data-cy="submit-button"
        [isLoading]="isLoading"
        [disabled]="form.invalid"
        (click)="submitData()">
        {{ 'ui.form.action.submit' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ResourceLinkDialogComponent implements OnDestroy {
  private _ngUnsubscribe = new Subject<void>();

  readonly title = `Create a collection of ${this.data.resources.length} resources`;
  form = this._fb.group({
    label: ['', [Validators.required]],
    comment: [''],
  });

  isLoading = false;
  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _fb: FormBuilder,
    private _resourceService: ResourceService,
    private _router: Router,
    private _store: Store,
    public dialogRef: MatDialogRef<ResourceLinkDialogComponent, void>,
    @Inject(MAT_DIALOG_DATA) public data: ResourceLinkDialogProps
  ) {}

  ngOnDestroy() {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  submitData() {
    this.isLoading = true;
    const linkObj = this._createPayload();

    this._dspApiConnection.v2.res
      .createResource(linkObj)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(res => {
        const path = this._resourceService.getResourcePath(res.id);
        const goto = `/resource${path}`;
        this._router.navigate([]).then(() => window.open(goto, '_blank'));
        this.dialogRef.close();
      });
  }

  private _createPayload() {
    const linkObj = new CreateResource();

    linkObj.label = this.form.controls.label.value!;
    linkObj.type = Constants.LinkObj;
    linkObj.attachedToProject = this.data.projectUuid;

    linkObj.properties[Constants.HasLinkToValue] = this.data.resources.map(res => {
      const linkVal = new CreateLinkValue();
      linkVal.type = Constants.LinkValue;
      linkVal.linkedResourceIri = res.id;
      return linkVal;
    });

    const comment = this.form.controls.comment.value;

    if (comment) {
      const commentVal = new CreateTextValueAsString();
      commentVal.type = Constants.TextValue;
      commentVal.text = comment;
      linkObj.properties[Constants.HasComment] = [commentVal];
    }

    return linkObj;
  }
}
