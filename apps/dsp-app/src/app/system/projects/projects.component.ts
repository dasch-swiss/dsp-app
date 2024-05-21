import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { StoredProject } from '@dasch-swiss/dsp-js';
import {
  LoadProjectsAction,
  LoadUserAction,
  ProjectsSelectors,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

/**
 * projects component handles the list of projects
 * It's used in user-profile, on system-projects
 * but also on the landing page
 *
 * We build to lists: one with active projects
 * and another one with already deactivate (inactive) projects
 *
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input() isUsersProjects = false;

  get activeProjects$(): Observable<StoredProject[]> {
    return combineLatest([this.userActiveProjects$, this.allActiveProjects$]).pipe(
      takeUntil(this.ngUnsubscribe),
      map(([userActiveProjects, allActiveProjects]) => (this.isUsersProjects ? userActiveProjects : allActiveProjects))
    );
  }

  get inactiveProjects$(): Observable<StoredProject[]> {
    return combineLatest([this.userInactiveProjects$, this.allInactiveProjects$]).pipe(
      takeUntil(this.ngUnsubscribe),
      map(([userInactiveProjects, allInactiveProjects]) =>
        this.isUsersProjects ? userInactiveProjects : allInactiveProjects
      )
    );
  }

  @Select(UserSelectors.userActiveProjects) userActiveProjects$: Observable<StoredProject[]>;
  @Select(UserSelectors.userInactiveProjects) userInactiveProjects$: Observable<StoredProject[]>;
  @Select(ProjectsSelectors.allActiveProjects) allActiveProjects$: Observable<StoredProject[]>;
  @Select(ProjectsSelectors.allInactiveProjects)
  allInactiveProjects$: Observable<StoredProject[]>;
  @Select(ProjectsSelectors.isProjectsLoading)
  isProjectsLoading$: Observable<boolean>;

  constructor(
    private _titleService: Title,
    private _store: Store
  ) {}

  ngOnInit() {
    if (this.isUsersProjects) {
      this._titleService.setTitle('Your projects');
    } else {
      this._titleService.setTitle('All projects from DSP');
    }

    if (this._store.selectSnapshot(ProjectsSelectors.allProjects).length === 0) {
      this.refresh();
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * refresh list of projects after updating one
   */
  refresh(): void {
    this._store.dispatch(new LoadProjectsAction());
    const currentUser = this._store.selectSnapshot(UserSelectors.user);
    this._store.dispatch(new LoadUserAction(currentUser.username));
  }
}
