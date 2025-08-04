import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ResourceFetcherService, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { map, Observable } from 'rxjs';
import { PropertyValueService } from './property-value.service';

// TODO copied from action-bubble.component.ts -> change when we do a css refactor
@Component({
  selector: 'app-property-value-action-bubble',
  template: `
    <div class="action-bubble" data-cy="action-bubble">
      <div class="button-container d-flex">
        <ng-container *ngIf="date">
          <button
            mat-button
            class="edit"
            *ngIf="infoTooltip$ | async as infoTooltip"
            [matTooltip]="infoTooltip"
            (click)="$event.stopPropagation()">
            <mat-icon>info</mat-icon>
          </button>
        </ng-container>

        <span matTooltip="edit">
          <button
            *ngIf="userHasPermission('edit')"
            mat-button
            class="edit edit-button"
            (click)="$event.stopPropagation(); editAction.emit()"
            data-cy="edit-button">
            <mat-icon>edit</mat-icon>
          </button>
        </span>

        <span [matTooltip]="showDelete ? 'delete' : 'This value cannot be deleted because it is required'">
          <button
            *ngIf="userHasPermission('delete')"
            mat-button
            class="delete"
            data-cy="delete-button"
            (click)="$event.stopPropagation(); deleteAction.emit()">
            <mat-icon>delete</mat-icon>
          </button>
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
})
export class PropertyValueActionBubbleComponent implements OnInit {
  @Input({ required: true }) showDelete!: boolean;
  @Input({ required: true }) date!: string;
  @Output() editAction = new EventEmitter();
  @Output() deleteAction = new EventEmitter();

  infoTooltip$!: Observable<string>;

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
        return `Creation date: ${this.date}. Value creator: ${creator}`;
      })
    );
  }
}
