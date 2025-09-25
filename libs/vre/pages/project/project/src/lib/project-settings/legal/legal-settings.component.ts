import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PaginatedApiService } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { BehaviorSubject, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import {
  CreateCopyrightHolderDialogComponent,
  CreateCopyrightHolderDialogProps,
} from './create-copyright-holder-dialog.component';

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
  standalone: false,
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
    private _dialog: MatDialog,
    private _paginatedApi: PaginatedApiService,
    private _projectPageService: ProjectPageService
  ) {}

  addCopyrightHolder() {
    this._projectPageService.currentProject$
      .pipe(
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
