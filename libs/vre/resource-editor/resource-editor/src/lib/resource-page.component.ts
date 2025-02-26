import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-resource-page',
  template:
    '<app-resource-fetcher *ngIf="resourceIri$ | async as resourceIri" [resourceIri]="resourceIri" (resourceIsDeleted)="goToHome()" />',
})
export class ResourcePageComponent {
  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _acs: AppConfigService,
    private _store: Store
  ) {}

  instanceId = this._route.snapshot.params[RouteConstants.instanceParameter];

  project$ = this._store.select(ProjectsSelectors.currentProject);
  resourceIri$ = this.project$.pipe(
    filter(v => v !== undefined),
    map(project => `${this._acs.dspAppConfig.iriBase}/${project.shortcode}/${this.instanceId}`)
  );

  goToHome() {
    this._router.navigate(['/']);
  }
}
