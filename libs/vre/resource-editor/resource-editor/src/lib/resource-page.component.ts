import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConfigService, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { map } from 'rxjs';

@Component({
  selector: 'app-resource-page',
  template: `<app-centered-layout>
    <app-resource-fetcher
      *ngIf="resourceIri$ | async as resourceIri"
      [resourceIri]="resourceIri"
      (afterResourceDeleted)="updateResourceCount()" />
  </app-centered-layout> `,
})
export class ResourcePageComponent {
  constructor(
    private _route: ActivatedRoute,
    private _acs: AppConfigService,
    private _projectPageService: ProjectPageService
  ) {}

  instanceId = this._route.snapshot.params[RouteConstants.instanceParameter];

  project$ = this._projectPageService.currentProject$;
  resourceIri$ = this.project$.pipe(
    map(project => `${this._acs.dspAppConfig.iriBase}/${project.shortcode}/${this.instanceId}`)
  );

  updateResourceCount(): void {
    this._projectPageService.reloadProject();
  }
}
