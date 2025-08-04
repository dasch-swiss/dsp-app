import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-property-value-basic-comment',
  template: ` <mat-form-field style="flex: 1; width: 100%; margin: 10px 0" subscriptSizing="dynamic">
    <mat-label>{{ 'resourceEditor.resourceProperties.comment' | translate }}</mat-label>
    <mat-icon matPrefix style="color: #808080" *ngIf="control.disabled">lock</mat-icon>
    <textarea cdkTextareaAutosize matInput data-cy="comment-textarea" [formControl]="control"></textarea>
  </mat-form-field>`,
})
export class PropertyValueBasicCommentComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
}
