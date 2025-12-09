import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-property-value-basic-comment',
  imports: [
    MatFormField,
    MatLabel,
    MatIcon,
    MatPrefix,
    CdkTextareaAutosize,
    MatInput,
    ReactiveFormsModule,
    TranslateModule,
  ],
  template: ` <mat-form-field style="flex: 1; width: 100%; margin: 10px 0" subscriptSizing="dynamic">
    <mat-label>{{ 'resourceEditor.resourceProperties.comment' | translate }}</mat-label>
    @if (control.disabled) {
      <mat-icon matPrefix style="color: #808080">lock</mat-icon>
    }
    <textarea cdkTextareaAutosize matInput data-cy="comment-textarea" [formControl]="control"></textarea>
  </mat-form-field>`,
  standalone: true,
})
export class PropertyValueBasicCommentComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
}
