import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { provideCompactFormFieldOptions } from '../template-switcher/compact-form-field-options';

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
    TranslatePipe,
  ],
  // Compact like the value it comments on. The top margin is room for the outlined label, which rises
  // above the field's border; the bottom one keeps the comment toggle below off the field.
  host: { class: 'compact-value-editor' },
  providers: [provideCompactFormFieldOptions()],
  template: ` <mat-form-field style="flex: 1; width: 100%; margin: 8px 0 4px">
    <mat-label>{{ 'resourceEditor.resourceProperties.comment' | translate }}</mat-label>
    @if (control.disabled) {
      <mat-icon matPrefix style="color: #808080">lock</mat-icon>
    }
    <textarea cdkTextareaAutosize matInput data-cy="comment-textarea" [formControl]="control"></textarea>
  </mat-form-field>`,
})
export class PropertyValueBasicCommentComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
}
