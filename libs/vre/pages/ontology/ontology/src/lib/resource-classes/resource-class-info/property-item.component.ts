import { Clipboard } from '@angular/cdk/clipboard';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatRipple } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { Cardinality, IHasProperty } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { Store } from '@ngxs/store';
import { Subject, takeUntil } from 'rxjs';
import { EditPropertyFormDialogComponent } from '../../forms/property-form/edit-property-form-dialog.component';
import { EditPropertyDialogData } from '../../forms/property-form/property-form.type';
import { ClassPropertyInfo } from '../../ontology.types';
import { OntologyEditService } from '../../services/ontology-edit.service';

@Component({
  selector: 'app-property-item',
  template: ` <div
      cdkDrag
      [cdkDragDisabled]="(isAdmin$ | async) !== true"
      (mouseenter)="isHovered = true"
      (mouseleave)="isHovered = false">
      <mat-list-item class="drag-n-drop-placeholder" *cdkDragPlaceholder></mat-list-item>
      <mat-list-item
        class="property-item"
        [class.admin]="(isAdmin$ | async) === true"
        matRipple
        #propertyCardRipple="matRipple">
        <div cdkDragHandle matListItemIcon class="list-icon">
          <mat-icon *ngIf="(isAdmin$ | async) === true && isHovered" class="drag-n-drop-handle"
            >drag_indicator
          </mat-icon>
          <mat-icon
            *ngIf="!isHovered || (isAdmin$ | async) !== true"
            [matTooltip]="
              classProp.propType?.group +
              ': ' +
              classProp.propType?.label +
              ' (' +
              classProp.propDef?.id?.split('#')[1] +
              ')'
            "
            matTooltipPosition="above"
            >{{ classProp.propType?.icon }}
          </mat-icon>
        </div>
        <div class="property-item-content-container">
          <div>
            <div class="upper-prop-container">
              <span class="label" data-cy="property-label"
                >{{ classProp.propDef.labels | appStringifyStringLiteral }}
              </span>
              <span
                data-cy="property-object-label"
                class="additional-info"
                *ngIf="classProp.objectLabels && classProp.objectLabels.length > 0"
                [innerHTML]="'&rarr;&nbsp;' + (classProp.objectLabels | appStringifyStringLiteral)"></span>
            </div>
            <div mat-line class="lower-prop-container">
              <span class="mat-caption"> {{ classProp.propDef.id | split: '#' : 1 }} </span>
              <mat-icon
                *ngIf="isHovered && classProp.propDef.comments?.length"
                [matTooltip]="classProp.propDef.comments | appStringifyStringLiteral"
                matTooltipPosition="above"
                class="info-icon">
                info
              </mat-icon>
            </div>
          </div>
          <app-cardinality
            [disabled]="(isAdmin$ | async) !== true"
            [classProp]="classProp"
            (cardinalityChange)="updateCardinality($event)" />
        </div>
        <div class="edit-menu">
          <mat-icon
            *ngIf="(isHovered || menuOpen) && (isAdmin$ | async) === true"
            (menuOpened)="menuOpen = true"
            (menuClosed)="menuOpen = false"
            [matMenuTriggerFor]="classInfoMenu"
            class="menu-icon-button"
            (click)="canBeRemovedFromClass()"
            >more_vert</mat-icon
          >
        </div>
      </mat-list-item>
    </div>
    <mat-menu #classInfoMenu="matMenu">
      <button mat-menu-item (click)="openEditProperty()">
        <mat-icon>edit</mat-icon>
        <span>Edit property</span>
      </button>
      <button mat-menu-item [disabled]="!propCanBeRemovedFromClass" (click)="removePropertyFromClass()">
        <mat-icon>link_off</mat-icon>
        <span>remove property from class</span>
      </button>
      <button mat-menu-item (click)="copyPropertyId()">
        <mat-icon>content_copy</mat-icon>
        Copy property id
      </button>
    </mat-menu>`,
  styles: [
    `
      @use '../../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .list-icon {
        color: black;
        display: flex;
        align-items: center;
      }

      .property-item {
        height: 3rem;
        align-items: center;
        border-radius: 8px;
        margin: 0;
      }

      .property-item.admin:hover {
        background: var(--element-active-hover);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .drag-n-drop-handle {
        cursor: move;
        color: var(--primary);
      }

      .property-item-content-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-right: 0.5rem;
      }

      .upper-prop-container {
        margin-top: 12px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .lower-prop-container {
        color: $primary_700;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .info-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
        line-height: 1;
        vertical-align: middle;
        cursor: help;
      }

      .drag-n-drop-placeholder {
        border: dotted 3px #999;
        border-radius: 8px;
        height: 54px;
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .edit-menu {
        position: absolute;
        top: 0.2rem;
        right: -6px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }

      .menu-icon-button {
        font-size: medium;
        cursor: pointer;
        margin-right: 0.1rem;
        margin-top: 0.1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyItemComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) classProp!: ClassPropertyInfo;
  @Output() cardinalityChange = new EventEmitter<IHasProperty>();

  @ViewChild('propertyCardRipple') propertyCardRipple!: MatRipple;

  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  isHovered = false;
  menuOpen = false;

  propCanBeRemovedFromClass = false;

  private _destroy = new Subject<void>();

  constructor(
    private _cdr: ChangeDetectorRef,
    private _clipboard: Clipboard,
    private _dialog: MatDialog,
    private _notification: NotificationService,
    private _oes: OntologyEditService,
    private _store: Store
  ) {}

  ngOnInit() {
    this._oes.latestChangedItem.pipe(takeUntil(this._destroy)).subscribe(item => {
      if (item && item === this.classProp.propDef.id) {
        this.propertyCardRipple?.launch({
          persistent: false,
        });
        this._oes.latestChangedItem.next(undefined);
      }
    });
  }

  ngAfterViewInit() {
    if (this._oes.latestChangedItem.value === this.classProp.propDef.id) {
      this.propertyCardRipple.launch({
        persistent: false,
      });
      this._oes.latestChangedItem.next(undefined);
    }
  }

  updateCardinality(newValue: Cardinality) {
    this.classProp.iHasProperty.cardinality = newValue;
    this.cardinalityChange.emit(this.classProp.iHasProperty);
  }

  canBeRemovedFromClass(): void {
    this._oes
      .propertyCanBeRemovedFromClass$(this.classProp.iHasProperty, this.classProp.classId)
      .subscribe(canDoRes => {
        this.propCanBeRemovedFromClass = canDoRes.canDo;
        this._cdr.markForCheck();
      });
  }

  removePropertyFromClass(): void {
    this._oes.removePropertyFromClass(this.classProp.iHasProperty, this.classProp.classId);
  }

  openEditProperty() {
    const propertyData: EditPropertyDialogData = {
      id: this.classProp.propDef.id,
      propType: this.classProp.propType,
      name: this.classProp.propDef.id?.split('#').pop() || '',
      label: this.classProp.propDef.labels,
      comment: this.classProp.propDef.comments,
      guiElement: this.classProp.propDef.guiElement || this.classProp.propType.guiElement,
      guiAttribute: this.classProp.propDef.guiAttributes[0],
      objectType: this.classProp.propDef.objectType,
    };
    this._dialog.open<EditPropertyFormDialogComponent, EditPropertyDialogData>(
      EditPropertyFormDialogComponent,
      DspDialogConfig.dialogDrawerConfig(propertyData)
    );
  }

  copyPropertyId() {
    this._clipboard.copy(this.classProp.propDef.id);
    this._notification.openSnackBar('Property ID copied to clipboard.');
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
  }
}
