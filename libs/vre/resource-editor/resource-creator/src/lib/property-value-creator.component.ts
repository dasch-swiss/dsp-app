import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { FormValueGroup, propertiesTypeMapping } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-property-value-creator',
  template: `
    @if (template) {
      <div style="display: flex; position: relative" [ngClass]="{ works: isValid$ | async }">
        <div style="flex: 1">
          <ng-container *ngTemplateOutlet="template; context: { item: formGroup.controls.item }" />
          @if (commentIsNotNull) {
            <app-property-value-basic-comment [control]="formGroup.controls.comment" />
          }
        </div>
        <div class="action-buttons">
          @if (canRemoveValue) {
            <button mat-icon-button type="button" color="primary" [matTooltip]="'remove'" (click)="removeValue.emit()">
              <mat-icon>delete</mat-icon>
            </button>
          }
          <button
            mat-icon-button
            type="button"
            color="primary"
            [hidden]="isHidden$ | async"
            (click)="toggleCommentValue()"
            [matTooltip]="commentIsNotNull ? 'remove comment' : 'add comment'">
            <mat-icon>{{ commentIsNotNull ? 'speaker_notes_off' : 'add_comment' }}</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .action-buttons {
        width: 140px;
        position: absolute;
        right: -140px;
      }
    `,
  ],
  standalone: false,
})
export class PropertyValueCreatorComponent implements OnInit {
  @Input({ required: true }) myProperty!: PropertyInfoValues;
  @Input({ required: true }) formGroup!: FormValueGroup;
  @Input({ required: true }) template!: TemplateRef<any>;
  @Input({ required: true }) canRemoveValue!: boolean;
  @Output() removeValue = new EventEmitter<void>();

  isValid$!: Observable<boolean>;
  isHidden$!: Observable<boolean>;

  get commentIsNotNull() {
    return this.formGroup.controls.comment.value !== null;
  }

  ngOnInit() {
    this.isValid$ = this.formGroup.controls.item.valueChanges.pipe(
      startWith(this.formGroup.controls.item.getRawValue()),
      map(change => {
        const mapping = propertiesTypeMapping.get(this.myProperty.propDef.objectType!);
        if (!mapping) {
          throw new AppError(
            `PropertyValueCreatorComponent: No mapping found for object type: ${this.myProperty.propDef.objectType}`
          );
        }
        return !mapping.isNullValue(change) && this.formGroup.controls.item.valid;
      })
    );

    this.isHidden$ = this.isValid$.pipe(map(value => !value));
  }

  toggleCommentValue() {
    this.formGroup.controls.comment.setValue(this.commentIsNotNull ? null : '');
  }
}
