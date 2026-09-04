import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UserService } from '@dasch-swiss/vre/core/session';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';
import { ProjectsListComponent } from './projects-list/projects-list.component';

/**
 * ProjectsComponent handles the list of projects.
 * It's used in user-profile, on system-projects but also on the landing page.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-projects',
  template: `
    <div class="app-projects">
      @if (projects$ | async; as projectsList) {
        <app-projects-list
          [projectsList]="projectsList"
          (refreshParent)="updateAndRefresh()"
          [createNewButtonEnabled]="true"
          [isUsersProjects]="isUsersProjects"
          data-cy="projects-section" />
      }
    </div>
  `,
  imports: [AsyncPipe, ProjectsListComponent],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  @Input() isUsersProjects = false;

  private _ngUnsubscribe = new Subject<void>();
  private _reloadProjectsSubject = new BehaviorSubject<null>(null);

  projects$ = this._reloadProjectsSubject.pipe(
    switchMap(() => (this.isUsersProjects ? this._userService.userProjects$ : this._allProjectsService.allProjects$)),
    takeUntil(this._ngUnsubscribe)
  );

  constructor(
    private readonly _userService: UserService,
    private readonly _allProjectsService: AllProjectsService,
    private readonly _titleService: Title
  ) {}

  ngOnInit() {
    this._titleService.setTitle(this.isUsersProjects ? 'Your projects' : 'All projects from DSP');
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  updateAndRefresh() {
    this._reloadProjects();
    this._userService.reloadUser().subscribe();
  }

  private _reloadProjects() {
    this._reloadProjectsSubject.next(null);
  }
}
