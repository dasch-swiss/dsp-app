import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { FilteredResources } from '@dasch-swiss/vre/shared/app-common-to-move';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ResourceLinkDialogComponent,
  ResourceLinkDialogProps,
} from '../resource-link-dialog/resource-link-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-intermediate',
  template: `
    <div class="card-container" *ngIf="resources">
      <div class="card front">
        <div class="mock title"></div>
        <div class="mock title"></div>
        <div class="mock content">
          <p class="count">{{ resources.count }}</p>
          <p class="text">{{ resources.count | i18nPlural: itemPluralMapping['resource'] }} Selected</p>
        </div>
        <div class="action">
          <span class="fill-remaining-space"></span>
          <span>
            <!-- link button to create a link resource (linkObj) -->
            <button
              mat-mini-fab
              color="primary"
              class="link"
              *ngIf="(mayHaveMultipleProjects$ | async) === false"
              matTooltip="Create a link object from this selection"
              [matTooltipPosition]="'above'"
              [disabled]="resources.count < 2"
              (click)="openDialog()">
              <mat-icon>link</mat-icon>
            </button>
            <!-- TODO: add more functionality for multiple resources: edit (only if same resource type), add to favorites, delete etc. -->
            <!-- compare button to compare more than two resources -->
            <button
              mat-mini-fab
              color="primary"
              class="compare"
              matTooltip="Compare the selected resources"
              [matTooltipPosition]="'above'"
              [disabled]="resources.count < 2"
              (click)="action.emit('compare')">
              <mat-icon>compare_arrows</mat-icon>
            </button>
          </span>
          <span class="fill-remaining-space"></span>
        </div>
      </div>
      <div *ngIf="resources.count > 1" class="card background two"></div>
      <div *ngIf="resources.count > 2" class="card background three"></div>
      <div *ngIf="resources.count > 3" class="card background more"></div>
    </div>
  `,
  styleUrls: ['./intermediate.component.scss'],
})
export class IntermediateComponent {
  @Input({ required: true }) resources!: FilteredResources;
  @Output() action = new EventEmitter<string>();

  itemPluralMapping = {
    resource: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': 'Resource',
      other: 'Resources',
    },
  };

  get mayHaveMultipleProjects$(): Observable<boolean> {
    return this._route.paramMap.pipe(
      map(params => {
        const uuid = this._route.parent?.snapshot.params[RouteConstants.uuidParameter];
        return !params.get(RouteConstants.project) && !uuid;
      })
    );
  }

  constructor(
    private _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _projectService: ProjectService
  ) {}

  openDialog(): void {
    const projectUuid =
      this._route.parent?.snapshot.params[RouteConstants.uuidParameter] ??
      this._route.snapshot.params[RouteConstants.project];
    if (!projectUuid) {
      throw new AppError('Project UUID is missing.');
    }

    this._dialog.open<ResourceLinkDialogComponent, ResourceLinkDialogProps>(ResourceLinkDialogComponent, {
      data: { resources: this.resources, projectUuid: this._projectService.uuidToIri(projectUuid) },
    });
  }
}
