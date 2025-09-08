import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UserService } from '@dasch-swiss/vre/core/session';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { BehaviorSubject, combineLatest, map, Subject, switchMap, takeUntil, tap } from 'rxjs';

/**
 * ProjectsComponent handles the list of projects.
 * It's used in user-profile, on system-projects but also on the landing page.
 * We build two lists: one with active projects and another one with deactivated projects.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-projects',
  template: `
    <div class="app-projects">
      @if (activeProjects$ | async; as projectsList) {
        <app-projects-list
          [projectsList]="projectsList"
          [isUserActive]="true"
          (refreshParent)="updateAndRefresh()"
          [createNewButtonEnabled]="true"
          [isUsersProjects]="isUsersProjects"
          data-cy="active-projects-section" />
      }
      @if (inactiveProjects$ | async; as inactiveProjects) {
        <app-projects-list
          [projectsList]="inactiveProjects"
          [isUserActive]="false"
          [isUsersProjects]="isUsersProjects"
          (refreshParent)="updateAndRefresh()"
          data-cy="inactive-projects-section" />
      }
    </div>
  `,
})
export class ProjectsComponent implements OnInit, OnDestroy {
  @Input() isUsersProjects = false;

  loading = true;

  private _ngUnsubscribe = new Subject<void>();
  private _reloadProjectsSubject = new BehaviorSubject<null>(null);

  private _allActiveProjects$ = this._reloadProjectsSubject.pipe(
    switchMap(() => this._allProjectsService.allActiveProjects$),
    tap(() => {
      this.loading = false;
    })
  );
  private _allInactiveProjects$ = this._reloadProjectsSubject.pipe(
    switchMap(() => this._allProjectsService.allInactiveProjects$)
  );

  inactiveProjects$ = combineLatest([this._userService.userInactiveProjects$, this._allInactiveProjects$]).pipe(
    takeUntil(this._ngUnsubscribe),
    map(([userInactiveProjects, allInactiveProjects]) =>
      this.isUsersProjects ? userInactiveProjects : allInactiveProjects
    )
  );

  activeProjects$ = combineLatest([this._userService.userActiveProjects$, this._allActiveProjects$]).pipe(
    takeUntil(this._ngUnsubscribe),
    map(([userActiveProjects, allActiveProjects]) => (this.isUsersProjects ? userActiveProjects : allActiveProjects))
  );

  constructor(
    private _userService: UserService,
    private _allProjectsService: AllProjectsService,
    private _titleService: Title
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
