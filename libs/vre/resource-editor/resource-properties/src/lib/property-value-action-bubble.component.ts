import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-value-action-bubble',
  template: `
    <div class="action-bubble" data-cy="action-bubble">
      <div class="button-container d-flex">
        @if (date) {
          @if (infoTooltip$ | async; as infoTooltip) {
            <button mat-button class="edit" [matTooltip]="infoTooltip" (click)="$event.stopPropagation()">
              <mat-icon>info</mat-icon>
            </button>
          }
        }

        <span [matTooltip]="'resourceEditor.resourceProperties.actions.edit' | translate">
          @if (userHasPermission('edit')) {
            <button
              mat-button
              class="edit edit-button"
              (click)="$event.stopPropagation(); editAction.emit()"
              data-cy="edit-button">
              <mat-icon>edit</mat-icon>
            </button>
          }
        </span>

        <span
          [matTooltip]="
            disableDeleteButton
              ? ('resourceEditor.resourceProperties.actions.cannotDeleteRequired' | translate)
              : ('resourceEditor.resourceProperties.actions.delete' | translate)
          ">
          @if (userHasPermission('delete')) {
            <button
              mat-button
              class="delete"
              [disabled]="disableDeleteButton"
              data-cy="delete-button"
              (click)="$event.stopPropagation(); deleteAction.emit()">
              <mat-icon>delete</mat-icon>
            </button>
          }
        </span>
      </div>
    </div>
  `,
  styleUrls: ['./property-value-action-bubble.component.scss'],
  standalone: false,
})
export class PropertyValueActionBubbleComponent implements OnInit {
  @Input({ required: true }) date!: string;
  @Output() editAction = new EventEmitter();
  @Output() deleteAction = new EventEmitter();

  infoTooltip$!: Observable<string>;

  constructor(
    private _resourceFetcherService: ResourceFetcherService,
    private _propertyValueService: PropertyValueService,
    private _translateService: TranslateService
  ) {}

  get disableDeleteButton(): boolean {
    const isRequired = [Cardinality._1, Cardinality._1_n].includes(this._propertyValueService.cardinality);
    const isOnlyValue = this._propertyValueService.editModeData.values.length === 1;
    return isRequired && isOnlyValue;
  }

  ngOnInit() {
    this.infoTooltip$ = this._getInfoToolTip();
  }

  userHasPermission(permissionType: 'edit' | 'delete'): boolean {
    if (this._resourceFetcherService.resourceVersion) {
      return false;
    }

    const value = this._propertyValueService.editModeData.values[0];
    return permissionType === 'edit' ? ResourceUtil.userCanEdit(value) : ResourceUtil.userCanDelete(value);
  }

  private _getInfoToolTip() {
    return this._resourceFetcherService.resource$.pipe(
      map(resource => {
        const creator = resource!.res!.attachedToUser;
        return this._translateService.instant('resourceEditor.resourceProperties.actions.creationInfo', {
          date: this.date,
          creator,
        });
      })
    );
  }
}
