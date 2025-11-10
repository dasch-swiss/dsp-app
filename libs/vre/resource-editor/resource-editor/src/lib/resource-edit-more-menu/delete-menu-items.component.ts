import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { CanDoResponse, DeleteResource, KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { filterNull, UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { combineLatest, filter, map, Observable } from 'rxjs';

@Component({
  selector: 'app-delete-menu-items',
  template: `
    @if (resourceFetcher.userCanDelete$ | async) {
      <app-delete-button
        [resourceCanBeDeleted$]="resourceCanBeDeleted$"
        [resource]="resource"
        (deleted)="resourceDeleted.emit()" />
    }

    @if (userHasProjectAdminRights$ | async) {
      <app-erase-button
        [resourceCanBeDeleted$]="resourceCanBeDeleted$"
        [resource]="resource"
        (erased)="resourceErased.emit()" />
    }
  `,
  standalone: false,
})
export class DeleteMenuItemsComponent implements OnInit {
  @Input({ required: true }) resource!: ReadResource;
  @Output() resourceDeleted = new EventEmitter<void>();
  @Output() resourceErased = new EventEmitter<void>();

  resourceCanBeDeleted$!: Observable<CanDoResponse>;

  readonly userHasProjectAdminRights$ = combineLatest([
    this._userService.user$.pipe(filterNull()),
    this.resourceFetcher.projectIri$,
  ]).pipe(map(([user, projectIri]) => UserPermissions.hasProjectAdminRights(user, projectIri)));

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    public resourceFetcher: ResourceFetcherService,
    private _userService: UserService
  ) {}

  ngOnInit() {
    this.resourceCanBeDeleted$ = this._canDeleteResource$(this.resource);
  }

  private _canDeleteResource$(resource: ReadResource): Observable<CanDoResponse> {
    const resourceToCheck = new DeleteResource();
    resourceToCheck.id = resource.id;
    resourceToCheck.type = resource.type;
    resourceToCheck.lastModificationDate = resource.lastModificationDate;
    return this._dspApiConnection.v2.res
      .canDeleteResource(resourceToCheck)
      .pipe(filter(res => res instanceof CanDoResponse));
  }
}
