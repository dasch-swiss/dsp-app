import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
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
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { CkEditorControlComponent, CommonInputComponent, DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, Subject } from 'rxjs';

export interface ResourceLinkDialogProps {
  resources: ReadResource[];
  projectUuid: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-link-dialog',
  template: `
    <app-dialog-header [title]="title" [subtitle]="'pages.dataBrowser.resourceLinkDialog.linkResources' | translate" />

    <mat-dialog-content>
      <form [formGroup]="form">
        <app-common-input
          [control]="form.controls.label"
          [label]="'pages.dataBrowser.resourceLinkDialog.collectionLabel' | translate" />

        <app-ck-editor-control
          [control]="form.controls.comment"
          [projectShortcode]="projectShortcode"
          [label]="'pages.dataBrowser.resourceLinkDialog.comment' | translate" />

        <div class="resource-container">
          <p>{{ 'pages.dataBrowser.resourceLinkDialog.resourcesWillBeConnected' | translate }}</p>
          <ul>
            @for (res of data.resources; track res) {
              <li>{{ res.label }}</li>
            }
          </ul>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">{{ 'ui.common.actions.cancel' | translate }}</button>

      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        data-cy="submit-button"
        [isLoading]="isLoading"
        [disabled]="form.invalid"
        (click)="submitData()">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatDialogContent,
    MatDialogActions,
    TranslateModule,
    DialogHeaderComponent,
    CommonInputComponent,
    CkEditorControlComponent,
    LoadingButtonDirective,
  ],
})
export class ResourceLinkDialogComponent implements OnDestroy {
  private _ngUnsubscribe = new Subject<void>();

  readonly title = this._translateService.instant('pages.dataBrowser.resourceLinkDialog.createCollection', {
    count: this.data.resources.length,
  });
  form = this._fb.group({
    label: ['', [Validators.required]],
    comment: [''],
  });

  isLoading = false;
  isSysAdmin$ = this._userService.isSysAdmin$;
  projectShortcode: string;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _fb: FormBuilder,
    private _resourceService: ResourceService,
    private _router: Router,
    private _translateService: TranslateService,
    private _userService: UserService,
    public dialogRef: MatDialogRef<ResourceLinkDialogComponent, void>,
    @Inject(MAT_DIALOG_DATA) public data: ResourceLinkDialogProps
  ) {
    this.projectShortcode = this._resourceService.getProjectShortcode(this.data.projectUuid);
  }

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
