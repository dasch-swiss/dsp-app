import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ClearProjectsAction, ClearProjectsMembershipAction } from '@dasch-swiss/vre/core/state';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-project-tile',
  templateUrl: './project-tile.component.html',
  styleUrls: ['./project-tile.component.scss'],
})
export class ProjectTileComponent {
  @Input() isLoading = false;
  @Input() project: StoredProject;
  @Input() sysAdmin: boolean; // used to show settings button

  constructor(
    private _router: Router,
    private _store: Store
  ) {}

  navigateToProject(id: string) {
    const uuid = ProjectService.IriToUuid(id);
    this._store.dispatch(new ClearProjectsAction());
    this._router.navigate([RouteConstants.project, uuid]);
  }

  navigateToSettings(id: string) {
    const uuid = ProjectService.IriToUuid(id);
    this._store.dispatch(new ClearProjectsMembershipAction());
    this._router.navigate([RouteConstants.project, uuid, RouteConstants.settings, RouteConstants.collaboration]);
  }
}
