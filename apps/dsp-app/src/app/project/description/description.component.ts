import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { StringLiteral } from '@dasch-swiss/dsp-js/src/models/admin/string-literal';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AppGlobal } from '../../app-global';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
})
export class DescriptionComponent {
  loading = false;
  readProject$ = this._route.paramMap.pipe(
    switchMap(params => {
      this.loading = true;
      return this._store
        .select(ProjectsSelectors.allProjects)
        .pipe(map(projects => projects.find(x => x.id.split('/').pop() === params.get(RouteConstants.uuidParameter))));
    }),
    tap(() => {
      this.loading = false;
    })
  );
  sortedDescriptions$ = this.readProject$.pipe(map(({ description }) => this._sortDescriptionsByLanguage(description)));
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

  constructor(
    private _route: ActivatedRoute,
    private _store: Store
  ) {}

  private _sortDescriptionsByLanguage(descriptions: StringLiteral[]): StringLiteral[] {
    const languageOrder = AppGlobal.languagesList.map(l => l.language);

    return descriptions.sort((a, b) => {
      const indexA = languageOrder.indexOf(a.language);
      const indexB = languageOrder.indexOf(b.language);

      return indexA - indexB;
    });
  }
}
