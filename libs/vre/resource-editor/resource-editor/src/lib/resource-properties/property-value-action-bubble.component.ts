import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { ResourceUtil } from '../representations/resource.util';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-value-action-bubble',
  imports: [AsyncPipe, MatButton, MatIcon, MatTooltip, TranslateModule],
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
  standalone: true,
})
export class PropertyValueActionBubbleComponent implements OnInit {
  @Input({ required: true }) date!: string;
  @Output() editAction = new EventEmitter();
  @Output() deleteAction = new EventEmitter();

  infoTooltip$!: Observable<string>;

  constructor(
    private readonly _resourceFetcherService: ResourceFetcherService,
    private readonly _propertyValueService: PropertyValueService,
    private readonly _translateService: TranslateService
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
