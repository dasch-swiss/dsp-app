import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Cardinality, ReadValue } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { startWith, takeWhile } from 'rxjs/operators';
import { FormValueGroup } from './form-value-array.type';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-property-value-edit',
  template: `
    <app-template-editor-switcher
      [myPropertyDefinition]="propertyValueService.propertyDefinition"
      [resourceClassIri]="propertyValueService.editModeData.resource.type"
      [value]="readValue"
      (templateFound)="foundTemplate($event)" />

    <div *ngIf="!loading; else loadingTpl" style="display: flex; padding: 16px 0">
      <div style="flex: 1">
        <ng-container *ngIf="template">
          <ng-container *ngTemplateOutlet="template; context: { item: group.controls.item }"></ng-container>
        </ng-container>

        <app-property-value-basic-comment [control]="group.controls.comment" />
      </div>

      <div style="display: flex">
        <button (click)="afterUndo.emit()" mat-icon-button color="primary">
          <mat-icon>undo</mat-icon>
        </button>

        <button
          *ngIf="group.controls.item.value !== null"
          (click)="onSave()"
          mat-icon-button
          data-cy="save-button"
          color="primary">
          <mat-icon>save</mat-icon>
        </button>
      </div>
    </div>

    <ng-template #loadingTpl>
      <app-progress-indicator [size]="'xsmall'" />
    </ng-template>
  `,
})
export class PropertyValueEditComponent implements OnInit, OnDestroy {
  @Input({ required: true }) readValue!: ReadValue | undefined;

  @Output() afterEdit = new EventEmitter<FormValueGroup>();
  @Output() afterUndo = new EventEmitter();
  template?: TemplateRef<any>;

  loading = false;
  private _subscription!: Subscription;

  group!: FormValueGroup;

  constructor(
    public propertyValueService: PropertyValueService,
    private _cd: ChangeDetectorRef
  ) {}

  protected readonly Cardinality = Cardinality;

  ngOnInit() {
    const propertyType = propertiesTypeMapping.get(this.propertyValueService.propertyDefinition.objectType!)!;
    this.group = new FormGroup({
      item: propertyType.control(this.readValue ?? propertyType.newValue),
      comment: new FormControl(this.readValue?.valueHasComment || null),
    });

    this._watchAndSetupCommentStatus();
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  foundTemplate(template: TemplateRef<any>) {
    this.template = template;
    this._cd.detectChanges();
  }

  onSave() {
    if (this.group.invalid) return;
    this.afterEdit.emit(this.group);
  }

  private _watchAndSetupCommentStatus() {
    this._subscription = this.group.controls.item.statusChanges
      .pipe(
        startWith(null),
        takeWhile(() => this.group !== undefined)
      )
      .subscribe(status => {
        if (status === 'INVALID' || this.group.controls.item.value === null) {
          this.group.controls.comment.disable();
        } else if (status === 'VALID') {
          this.group.controls.comment.enable();
        }
      });
  }
}
