import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { AlternatedListComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, first, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import {
  CreateCopyrightHolderDialogComponent,
  CreateCopyrightHolderDialogProps,
} from '../create-copyright-holder-dialog.component';
import { LegalSettingsLicensesComponent } from './legal-settings-licenses.component';

@Component({
  selector: 'app-legal-settings',
  template: `
    <div style="display: flex;justify-content: center; margin: 32px;">
      <div style="border: 1px solid; padding: 16px">{{ 'pages.project.legalSettings.warning' | translate }}</div>
    </div>
    <section class="section">
      <h2>
        {{ 'pages.project.legalSettings.copyrightHolders' | translate }}
        <button color="primary" mat-raised-button (click)="addCopyrightHolder()">
          {{ 'pages.project.legalSettings.add' | translate }}
        </button>
      </h2>
      <app-alternated-list>
        @for (item of copyrightHolders$ | async; track item) {
          <div>{{ item }}</div>
        }
      </app-alternated-list>
    </section>

    <section class="section">
      <h2>{{ 'pages.project.legalSettings.licenses' | translate }}</h2>
      <app-legal-settings-licenses />
    </section>
    <section class="section">
      <h2 style="display: flex; align-items: center; gap: 8px">
        {{ 'pages.project.legalSettings.authorship' | translate }}
        <mat-icon color="primary" [matTooltip]="'pages.project.legalSettings.authorshipTooltip' | translate">
          info
        </mat-icon>
      </h2>

      @if (authorships$ | async; as authorship) {
        <app-alternated-list>
          @for (item of authorship; track item) {
            <div>{{ item }}</div>
          }
        </app-alternated-list>
        @if (authorship.length === 0) {
          <div>
            {{ 'pages.project.legalSettings.noAuthorship' | translate }}
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .section {
        margin-bottom: 48px;
      }
    `,
  ],
  imports: [
    AlternatedListComponent,
    AsyncPipe,
    LegalSettingsLicensesComponent,
    MatButton,
    MatIcon,
    MatTooltip,
    TranslatePipe,
  ],
})
export class LegalSettingsComponent {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);

  readonly project$ = this._reloadSubject
    .asObservable()
    .pipe(switchMap(() => this._projectPageService.currentProject$));

  copyrightHolders$ = this.project$.pipe(
    switchMap(project => this._paginatedApi.getCopyrightHolders(project.shortcode))
  );

  authorships$ = this.project$.pipe(switchMap(project => this._paginatedApi.getAuthorships(project.shortcode)));

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _paginatedApi: PaginatedApiService,
    private readonly _projectPageService: ProjectPageService
  ) {}

  addCopyrightHolder() {
    this._projectPageService.currentProject$
      .pipe(
        first(),
        switchMap(currentProject =>
          this._dialog
            .open<
              CreateCopyrightHolderDialogComponent,
              CreateCopyrightHolderDialogProps,
              boolean
            >(CreateCopyrightHolderDialogComponent, { data: { projectShortcode: currentProject.shortcode } })
            .afterClosed()
        )
      )
      .subscribe(success => {
        if (success) {
          this._reloadSubject.next();
        }
      });
  }
}
