import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatChip, MatChipListbox } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { AvailableLanguageKeys, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectImageCoverComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { ClosingDialogComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { map, tap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { LicenseCaptionsMapping } from './license-captions-mapping';

@Component({
  selector: 'app-project-description-page',
  templateUrl: './project-description-page.component.html',
  imports: [
    AsyncPipe,
    UpperCasePipe,
    MatButton,
    MatIcon,
    MatChip,
    MatChipListbox,
    MatDivider,
    RouterLink,
    TranslatePipe,
    ClosingDialogComponent,
    ProjectImageCoverComponent,
  ],
})
export class ProjectDescriptionPageComponent {
  readonly routeConstants = RouteConstants;

  readProject$ = this._projectPageService.currentProject$.pipe(
    tap(project => {
      this.hasManualLicense = LicenseCaptionsMapping.get(project.shortcode);
    })
  );

  sortedDescriptions$ = this.readProject$.pipe(map(({ description }) => this._sortDescriptionsByLanguage(description)));

  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  hasManualLicense?: string;

  constructor(private readonly _projectPageService: ProjectPageService) {}

  private _sortDescriptionsByLanguage(descriptions: StringLiteral[]): StringLiteral[] {
    const languageOrder = AvailableLanguageKeys as readonly string[];

    return descriptions.sort((a, b) => {
      const indexA = languageOrder.indexOf(a.language!);
      const indexB = languageOrder.indexOf(b.language!);

      return indexA - indexB;
    });
  }
}
