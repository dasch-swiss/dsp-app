import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CommonInputComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { OntologyForm, UpdateOntologyData } from './ontology-form.type';

@Component({
  selector: 'app-ontology-form',
  template: `
    <form [formGroup]="ontologyForm">
      <app-common-input
        [control]="ontologyForm.controls.label"
        [label]="'pages.ontology.ontologyForm.label' | translate"
        data-cy="label-input" />

      <mat-form-field style="width: 100%">
        <mat-label>{{ 'pages.ontology.ontologyForm.comment' | translate }}</mat-label>
        <textarea
          matInput
          data-cy="comment-textarea"
          [formControl]="ontologyForm.controls.comment"
          [cdkTextareaAutosize]="true"
          [cdkAutosizeMinRows]="6"
          [cdkAutosizeMaxRows]="12">
        </textarea>
      </mat-form-field>
    </form>
  `,
  imports: [
    CdkTextareaAutosize,
    CommonInputComponent,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class OntologyFormComponent implements OnInit {
  @Input({ required: true }) mode!: 'create' | 'edit';
  @Input() data?: UpdateOntologyData;
  @Output() afterFormInit = new EventEmitter<OntologyForm>();

  ontologyForm!: OntologyForm;

  constructor(private readonly _fb: FormBuilder) {}

  ngOnInit() {
    this._buildForm();
  }

  private _buildForm(): void {
    this.ontologyForm = this._fb.group({
      label: this._fb.control(this.data?.label || '', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      comment: this._fb.control(this.data?.comment || '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });

    this.afterFormInit.emit(this.ontologyForm);
  }
}
