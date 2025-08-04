import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { FormValueGroup, propertiesTypeMapping } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-property-value-creator',
  template: `
    <div style="display: flex; position: relative" [ngClass]="{ works: isValid$ | async }" *ngIf="template">
      <div style="flex: 1">
        <ng-container *ngTemplateOutlet="template; context: { item: formArray.controls.item }"></ng-container>
        <app-property-value-basic-comment *ngIf="commentIsNotNull" [control]="formArray.controls.comment" />
      </div>
      <div style="width: 140px; position: absolute; right: -160px">
        <button
          mat-icon-button
          type="button"
          color="primary"
          [hidden]="isHidden$ | async"
          (click)="toggleCommentValue()"
          [matTooltip]="commentIsNotNull ? 'Remove comment' : 'Add comment'">
          <mat-icon>{{ commentIsNotNull ? 'speaker_notes_off' : 'add_comment' }}</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [``],
})
export class PropertyValueCreatorComponent implements OnInit {
  @Input({ required: true }) myProperty!: PropertyInfoValues;
  @Input({ required: true }) formArray!: FormValueGroup;
  @Input({ required: true }) template!: TemplateRef<any>;

  isValid$!: Observable<boolean>;
  isHidden$!: Observable<boolean>;

  get commentIsNotNull() {
    return this.formArray.controls.comment.value !== null;
  }

  ngOnInit() {
    this.isValid$ = this.formArray.controls.item.valueChanges.pipe(
      startWith(this.formArray.controls.item.getRawValue()),
      map(change => {
        const mapping = propertiesTypeMapping.get(this.myProperty.propDef.objectType!);
        if (!mapping) {
          throw new AppError(
            `PropertyValueCreatorComponent: No mapping found for object type: ${this.myProperty.propDef.objectType}`
          );
        }
        return !mapping.isNullValue(change) && this.formArray.controls.item.valid;
      })
    );

    this.isHidden$ = this.isValid$.pipe(map(value => !value));
  }

  toggleCommentValue() {
    this.formArray.controls.comment.setValue(this.commentIsNotNull ? null : '');
  }
}
