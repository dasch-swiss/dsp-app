import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { LoadProjectMembersAction, ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-collaboration',
  templateUrl: './collaboration.component.html',
  styleUrls: ['./collaboration.component.scss'],
})
export class CollaborationComponent implements OnInit {
  project$ = this._store.select(ProjectsSelectors.currentProject);
  projectMembers$ = this._store.select(ProjectsSelectors.projectMembers);
  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  projectUuid$ = this.project$.pipe(
    tap(p => {
      this._titleService.setTitle(`Project ${p?.shortname} | Collaboration`);
    }),
    map(p => {
      return ProjectService.IriToUuid(p?.id || '');
    }),
    filter(uuid => !!uuid),
    first()
  );

  get activeProjectMembers$(): Observable<ReadUser[]> {
    return combineLatest([this.project$, this.projectMembers$]).pipe(
      map(([currentProject, projectMembers]) => {
        if (!currentProject || !projectMembers[currentProject.id]) {
          return [];
        }
        return projectMembers[currentProject.id]?.value.filter(member => member?.status === true) || [];
      })
    );
  }

  get inactiveProjectMembers$(): Observable<ReadUser[]> {
    return combineLatest([this.project$, this.projectMembers$]).pipe(
      map(([currentProject, projectMembers]) => {
        if (!currentProject || !projectMembers[currentProject.id]) {
          return [];
        }
        return projectMembers[currentProject?.id].value.filter(member => member?.status === false) || [];
      })
    );
  }

  constructor(
    private _store: Store,
    protected _titleService: Title
  ) {}

  ngOnInit() {
    this.projectUuid$.subscribe(projectUuid => {
      if (projectUuid) {
        this._store.dispatch(new LoadProjectMembersAction(projectUuid));
      }
    });
  }
}
