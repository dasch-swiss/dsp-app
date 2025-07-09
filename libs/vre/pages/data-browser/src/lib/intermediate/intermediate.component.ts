import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { FilteredResources } from '@dasch-swiss/vre/shared/app-common-to-move';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { BehaviorSubject, combineLatest, forkJoin, map, Observable, shareReplay, switchMap } from 'rxjs';
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
              *ngIf="canBelinked$ | async"
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
  private _resourcesSubject = new BehaviorSubject<FilteredResources | null>(null);
  private _resources!: FilteredResources;

  readonly uniqueSelectedProjectIris$ = this._resourcesSubject.pipe(
    switchMap(resources =>
      !resources || resources.resInfo.length === 0
        ? [new Set<string>()]
        : forkJoin(resources.resInfo.map(res => this._dspApiConnection.v2.res.getResource(res.id))).pipe(
            map(fetchedResources => {
              const iris = new Set<string>();
              for (const res of fetchedResources) {
                if (res.attachedToProject) {
                  iris.add(res.attachedToProject);
                }
              }
              return iris;
            })
          )
    ),
    shareReplay(1)
  );

  readonly canBelinked$: Observable<boolean> = combineLatest([
    this._store.select(UserSelectors.user),
    this._store.select(UserSelectors.userProjectAdminGroups),
    this.uniqueSelectedProjectIris$,
  ]).pipe(
    map(([user, userProjectGroups, projectIrisSet]) => {
      const projectIri = projectIrisSet?.values().next().value;
      return (
        !!user &&
        !!userProjectGroups &&
        projectIrisSet?.size === 1 &&
        !!projectIri &&
        ProjectService.IsProjectMemberOrAdminOrSysAdmin(user, userProjectGroups, projectIri)
      );
    })
  );

  @Input({ required: true })
  set resources(value: FilteredResources) {
    this._resources = value;
    this._resourcesSubject.next(value);
  }

  get resources(): FilteredResources {
    return this._resources;
  }

  @Output() action = new EventEmitter<string>();

  itemPluralMapping = {
    resource: {
      '=1': 'Resource',
      other: 'Resources',
    },
  };

  constructor(
    private _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _projectService: ProjectService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _store: Store
  ) {}

  openDialog(): void {
    const projectUuid =
      this._route.parent?.snapshot.params[RouteConstants.uuidParameter] ??
      this._route.snapshot.params[RouteConstants.project];

    if (!projectUuid) {
      throw new AppError('Project UUID is missing.');
    }

    this._dialog.open<ResourceLinkDialogComponent, ResourceLinkDialogProps>(ResourceLinkDialogComponent, {
      data: {
        resources: this.resources,
        projectUuid: this._projectService.uuidToIri(projectUuid),
      },
    });
  }
}
