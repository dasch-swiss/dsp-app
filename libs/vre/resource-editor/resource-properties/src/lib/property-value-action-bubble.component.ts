import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { PropertyValueService } from './property-value.service';

// TODO copied from action-bubble.component.ts -> change when we do a css refactor
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
            showDelete
              ? ('resourceEditor.resourceProperties.actions.delete' | translate)
              : ('resourceEditor.resourceProperties.actions.cannotDeleteRequired' | translate)
          ">
          @if (userHasPermission('delete')) {
            <button
              mat-button
              class="delete"
              data-cy="delete-button"
              (click)="$event.stopPropagation(); deleteAction.emit()">
              <mat-icon>delete</mat-icon>
            </button>
          }
        </span>
      </div>
    </div>
  `,
  animations: [
    trigger('simpleFadeAnimation', [
      state('in', style({ opacity: 1 })),
      transition(':enter', [style({ opacity: 0 }), animate(150)]),
      transition(':leave', animate(150, style({ opacity: 0 }))),
    ]),
  ],
  styleUrls: ['./property-value-action-bubble.component.scss'],
  standalone: false,
})
export class PropertyValueActionBubbleComponent implements OnInit {
  @Input({ required: true }) showDelete!: boolean;
  @Input({ required: true }) date!: string;
  @Output() editAction = new EventEmitter();
  @Output() deleteAction = new EventEmitter();

  infoTooltip$!: Observable<string>;

  private readonly _translateService = inject(TranslateService);

  constructor(
    private _resourceFetcherService: ResourceFetcherService,
    private _propertyValueService: PropertyValueService
  ) {}

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
