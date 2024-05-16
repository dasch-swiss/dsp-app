import { ChangeDetectorRef, Component, Inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ApiResponseError,
  Cardinality,
  Constants,
  CreateValue,
  KnoraApiConnection,
  ReadResource,
  ReadValue,
  UpdateResource,
  UpdateValue,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { LoadAnnotatedResourceAction, LoadResourceAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { finalize, startWith, switchMap, take, tap } from 'rxjs/operators';
import { DeleteValueDialogComponent, DeleteValueDialogProps } from './delete-value-dialog.component';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-property-value',
  template: ` <div
    data-cy="property-value"
    style="position: relative; min-height: 40px; width: 100%"
    (mouseenter)="showBubble = true"
    (mouseleave)="showBubble = false">
    <app-property-value-action-bubble
      [editMode]="!displayMode"
      *ngIf="!propertyValueService.keepEditMode && showBubble"
      [date]="propertyValueService._editModeData?.values[index]?.valueCreationDate"
      [showDelete]="index > 0 || [Cardinality._0_1, Cardinality._0_n].includes(propertyValueService.cardinality)"
      (editAction)="propertyValueService.toggleOpenedValue(index)"
      (deleteAction)="askToDelete()"></app-property-value-action-bubble>

    <div style="display: flex">
      <div class="item" [ngClass]="{ hover: displayMode }">
        <ng-container
          *ngTemplateOutlet="itemTpl; context: { item: group.controls.item, displayMode: displayMode }"></ng-container>

        <app-property-value-comment
          [displayMode]="displayMode"
          [control]="group.controls.comment"></app-property-value-comment>
      </div>
      <button
        (click)="onSave()"
        mat-icon-button
        data-cy="save-button"
        *ngIf="!displayMode && !propertyValueService.keepEditMode && !loading"
        [disabled]="
          (initialFormValue.item === group.value.item && initialFormValue.comment === group.value.comment) ||
          (initialFormValue.comment === null && group.value.comment === '')
        ">
        <mat-icon>save</mat-icon>
      </button>
      <dasch-swiss-app-progress-indicator *ngIf="loading"></dasch-swiss-app-progress-indicator>
    </div>
  </div>`,
  styles: ['.item {flex: 1; &.hover:hover{background: #f5f5f5}}'],
})
export class PropertyValueComponent implements OnInit {
  @Input() itemTpl!: TemplateRef<any>;
  @Input() index!: number;

  initialFormValue!: { item: any; comment: string | null };

  showBubble = false;
  displayMode = true;
  loading = false;

  subscription!: Subscription;

  protected readonly Cardinality = Cardinality;

  get group() {
    return this.propertyValueService.formArray.at(this.index);
  }

  constructor(
    public propertyValueService: PropertyValueService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _cdr: ChangeDetectorRef,
    private _notification: NotificationService,
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef,
    private _store: Store
  ) {}

  ngOnInit() {
    this._setInitialValue();
    this._setupDisplayMode();
    this._watchAndSetupCommentStatus();
  }

  private _setInitialValue() {
    this.initialFormValue = this.group.getRawValue();
  }

  onSave() {
    if (this.propertyValueService.currentlyAdding && this.index === this.propertyValueService.formArray.length - 1) {
      this._addItem();
    } else {
      this._update();
    }
  }

  askToDelete() {
    this._dialog.open<DeleteValueDialogComponent, DeleteValueDialogProps>(DeleteValueDialogComponent, {
      data: { index: this.index },
      viewContainerRef: this._viewContainerRef,
    });
  }

  private _watchAndSetupCommentStatus() {
    this.subscription = this.group.controls.item.statusChanges.pipe(startWith(null)).subscribe(status => {
      if (status === 'INVALID' || this.group.controls.item.value === null) {
        this.group.controls.comment.disable();
      } else if (status === 'VALID') {
        this.group.controls.comment.enable();
      }
    });
  }

  private _addItem() {
    if (this.group.invalid) return;

    this.loading = true;

    const createVal = propertiesTypeMapping
      .get(this.propertyValueService.propertyDefinition.objectType!)!
      .createValue(this.group.controls.item.value, this.propertyValueService.propertyDefinition);

    if (this.group.controls.comment.value) {
      createVal.valueHasComment = this.group.controls.comment.value;
    }

    const resource = this.propertyValueService._editModeData?.resource as ReadResource;
    const updateRes = new UpdateResource();
    updateRes.id = resource.id;
    updateRes.type = resource.type;
    updateRes.property = this.propertyValueService.propertyDefinition.id;
    updateRes.value = createVal;

    this._dspApiConnection.v2.values
      .createValue(updateRes as UpdateResource<CreateValue>)
      .pipe(
        take(1),
        switchMap((): any => {
          if (resource.type === Constants.Region) {
            this._store.dispatch(new LoadAnnotatedResourceAction(resource.id));
          } else {
            this._store.dispatch(new LoadResourceAction(resource.id));
          }
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        () => {
          this.propertyValueService.currentlyAdding = false;
          this.propertyValueService.toggleOpenedValue(this.index);
          this._cdr.detectChanges();
        },
        (e: ApiResponseError) => {
          if (e.status === 400) {
            this._notification.openSnackBar('The value entered already exists.');
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw e;
        }
      );
  }

  private _setupDisplayMode() {
    if (this.propertyValueService.keepEditMode) {
      this.displayMode = false;
      return;
    }
    this.propertyValueService.lastOpenedItem$.subscribe(value => {
      if (this.propertyValueService.currentlyAdding && !this.displayMode) {
        this.propertyValueService.formArray.removeAt(this.propertyValueService.formArray.length - 1);
        this.propertyValueService.currentlyAdding = false;
        return;
      }

      if (value === null) {
        this.propertyValueService.formArray.at(this.index).patchValue(this.initialFormValue);
      }

      this.displayMode = this.index !== value;
    });
  }

  _update() {
    if (this.group.invalid) return;

    this.loading = true;

    this._dspApiConnection.v2.values
      .updateValue(this._getPayload(this.index))
      .pipe(
        take(1),
        tap((): any => {
          if (this.propertyValueService._editModeData?.resource.type === Constants.Region) {
            this._store.dispatch(new LoadAnnotatedResourceAction(this.propertyValueService._editModeData!.resource.id));
          } else {
            this._store.dispatch(new LoadResourceAction(this.propertyValueService._editModeData!.resource.id));
          }
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.propertyValueService.toggleOpenedValue(this.index);
        this._setInitialValue();
        this._cdr.detectChanges();
      });
  }

  private _getUpdatedValue(index: number) {
    const group = this.propertyValueService.formArray.at(index);
    const values = this.propertyValueService._editModeData?.values as ReadValue[];
    const id = values[index].id;
    const entity = propertiesTypeMapping
      .get(this.propertyValueService.propertyDefinition.objectType!)!
      .updateValue(id, group.controls.item.value, this.propertyValueService.propertyDefinition);
    if (group.controls.comment.value) {
      entity.valueHasComment = group.controls.comment.value;
    }
    return entity;
  }

  private _getPayload(index: number) {
    const updateResource = new UpdateResource<UpdateValue>();
    const { resource, values } = this.propertyValueService._editModeData as {
      resource: ReadResource;
      values: ReadValue[];
    };
    updateResource.id = resource.id;
    updateResource.property = values[index].property;
    updateResource.type = resource.type;
    updateResource.value = this._getUpdatedValue(index);
    return updateResource;
  }
}
