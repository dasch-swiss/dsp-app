import { Component } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { StringLiteral } from '@dasch-swiss/dsp-js/src/models/admin/string-literal';
import { AvailableLanguages, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { filter, map, tap } from 'rxjs/operators';
import { LicenseCaptionsMapping } from './license-captions-mapping';

@Component({
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
})
export class DescriptionComponent {
  readonly routeConstants = RouteConstants;

  readProject$ = this._store.select(ProjectsSelectors.currentProject).pipe(
    filter((readProject): readProject is ReadProject => !!readProject),
    tap(project => {
      this.hasManualLicense = LicenseCaptionsMapping.get(project.shortcode);
    })
  );

  sortedDescriptions$ = this.readProject$.pipe(
    filter((readProject): readProject is ReadProject => !!readProject),
    map(({ description }) => this._sortDescriptionsByLanguage(description))
  );

  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  isLoading$ = this._store.select(ProjectsSelectors.isProjectsLoading);

  hasManualLicense?: string;

  constructor(private _store: Store) {}

  private _sortDescriptionsByLanguage(descriptions: StringLiteral[]): StringLiteral[] {
    const languageOrder = AvailableLanguages.map(l => l.language);

    return descriptions.sort((a, b) => {
      const indexA = languageOrder.indexOf(a.language);
      const indexB = languageOrder.indexOf(b.language);

      return indexA - indexB;
    });
  }
}
