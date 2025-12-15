import { DialogRef } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import {
  ChipListInputComponent,
  CkEditorControlComponent,
  CommonInputComponent,
  DialogHeaderComponent,
  TimeInputComponent,
} from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { SegmentApiService } from './segment-api.service';
import { SegmentsService } from './segments.service';

export interface CreateSegmentDialogProps {
  resource: ReadResource;
  videoDurationSecs: number;
  type: 'VideoSegment' | 'AudioSegment';
  projectShortcode: string;
}

@Component({
  selector: 'app-create-segment-dialog',
  imports: [
    DialogHeaderComponent,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    CommonInputComponent,
    TimeInputComponent,
    ChipListInputComponent,
    CkEditorControlComponent,
    MatButton,
    LoadingButtonDirective,
    TranslatePipe,
  ],
  template: ` <app-dialog-header
      [title]="'resourceEditor.segmentSupport.createSegmentDialog.createAnnotation' | translate" />
    <div mat-dialog-content>
      <app-common-input
        [control]="form.controls.label"
        [label]="'resourceEditor.segmentSupport.createSegmentDialog.label' | translate" />
      <app-time-input
        [label]="'resourceEditor.segmentSupport.createSegmentDialog.start' | translate"
        [control]="form.controls.start"
        data-cy="start-input" />
      <app-time-input
        [label]="'resourceEditor.segmentSupport.createSegmentDialog.end' | translate"
        [control]="form.controls.end"
        data-cy="end-input" />
      <app-common-input
        [label]="'resourceEditor.segmentSupport.createSegmentDialog.title' | translate"
        [control]="form.controls.title"
        data-cy="title-input" />
      <app-common-input
        [label]="'ui.common.fields.description' | translate"
        [control]="form.controls.description"
        data-cy="description-input" />
      <app-chip-list-input
        [formArray]="form.controls.keywords"
        data-cy="keywords-input"
        [validators]="keywordsValidators" />
      <app-ck-editor-control
        [control]="form.controls.comment"
        [projectShortcode]="projectShortcode"
        [label]="'resourceEditor.resourceProperties.comment' | translate" />
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close data-cy="cancel-button">{{ 'ui.common.actions.cancel' | translate }}</button>
      <button
        data-cy="submit-button"
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="onSubmit()">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </div>`,
})
export class CreateSegmentDialogComponent {
  loading = false;
  projectShortcode: string;

  readonly keywordsValidators = [Validators.minLength(3), Validators.maxLength(64)];
  form = this._fb.group(
    {
      label: ['', Validators.required],
      start: [0, [Validators.required, Validators.min(0)]],
      end: [0, [Validators.required, Validators.max(this.data.videoDurationSecs)]],
      title: null as string | null,
      description: null as string | null,
      comment: null as string | null,
      keywords: this._fb.array([]),
    },
    { validators: [this.rangeValidator] }
  );

  constructor(
    private readonly _fb: FormBuilder,
    private readonly _segmentApi: SegmentApiService,
    private readonly _segmentsService: SegmentsService,
    private readonly _dialogRef: DialogRef,
    @Inject(MAT_DIALOG_DATA) public data: CreateSegmentDialogProps
  ) {
    this.projectShortcode = data.projectShortcode;
  }

  rangeValidator(formGroup: FormGroup) {
    const start = formGroup.get('start')?.value;
    const end = formGroup.get('end')?.value;

    return end > start ? null : { rangeError: true };
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    this._segmentApi
      .createSegment(
        this.data.type,
        this.data.resource.id,
        this.data.resource.attachedToProject,
        formValue.label as string,
        formValue.start as number,
        formValue.end as number,
        formValue.comment ?? undefined,
        formValue.title ?? undefined,
        formValue.description ?? undefined,
        formValue.keywords.length > 0 ? formValue.keywords.join(' ') : undefined
      )
      .subscribe(() => {
        this._segmentsService.getSegment(this.data.resource.id, this.data.type);
        this._dialogRef.close();
      });
  }
}
