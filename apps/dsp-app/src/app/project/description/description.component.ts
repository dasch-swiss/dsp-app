import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { StringLiteral } from '@dasch-swiss/dsp-js/src/models/admin/string-literal';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil, takeWhile } from 'rxjs/operators';
import { AppGlobal } from '../../app-global';

@Component({
  // changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
})
export class DescriptionComponent implements OnDestroy {
  destroyed$: Subject<void> = new Subject<void>();

  readProject$ = combineLatest([this._route.paramMap, this._store.select(ProjectsSelectors.allProjects)]).pipe(
    takeUntil(this.destroyed$),
    map(([params, allProjects]) => {
      const projects = allProjects.find(x => x.id.split('/').pop() === params.get(RouteConstants.uuidParameter));
      return projects;
    })
  );

  sortedDescriptions$ = this.readProject$.pipe(
    takeUntil(this.destroyed$),
    takeWhile(readProject => readProject !== undefined),
    map(({ description }) => this._sortDescriptionsByLanguage(description))
  );

  userHasPermission$ = combineLatest([
    this._store.select(UserSelectors.user),
    this.readProject$,
    this._store.select(UserSelectors.userProjectAdminGroups),
  ]).pipe(
    map(([user, readProject, userProjectGroups]) => {
      if (readProject == null) {
        return false;
      }

      return ProjectService.IsProjectAdminOrSysAdmin(user as ReadUser, userProjectGroups, readProject.id);
    })
  );

  RouteConstants = RouteConstants;

  @Select(ProjectsSelectors.isProjectsLoading) isLoading$: Observable<boolean>;

  constructor(
    private _route: ActivatedRoute,
    private _store: Store,
    private _projectService: ProjectService
  ) {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private _sortDescriptionsByLanguage(descriptions: StringLiteral[]): StringLiteral[] {
    const languageOrder = AppGlobal.languagesList.map(l => l.language);

    return descriptions.sort((a, b) => {
      const indexA = languageOrder.indexOf(a.language);
      const indexB = languageOrder.indexOf(b.language);

      return indexA - indexB;
    });
  }
}
