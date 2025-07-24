import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { PaginatedApiService } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { Store } from '@ngxs/store';
import { BehaviorSubject, filter, map, switchMap } from 'rxjs';
import {
  CreateCopyrightHolderDialogComponent,
  CreateCopyrightHolderDialogProps,
} from './create-copyright-holder-dialog.component';

@Component({
  selector: 'app-legal-settings',
  template: `
    <app-centered-layout>
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
          <div *ngFor="let item of copyrightHolders$ | async">{{ item }}</div>
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

        <ng-container *ngIf="authorships$ | async as authorship">
          <app-alternated-list>
            <div *ngFor="let item of authorship">{{ item }}</div>
          </app-alternated-list>

          <div *ngIf="authorship.length === 0">
            {{ 'pages.project.legalSettings.noAuthorship' | translate }}
          </div>
        </ng-container>
      </section>
    </app-centered-layout>
  `,
  styles: [
    `
      .section {
        margin-bottom: 48px;
      }
    `,
  ],
})
export class LegalSettingsComponent {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);

  readonly project$ = this._reloadSubject.asObservable().pipe(
    switchMap(() => this._store.select(ProjectsSelectors.currentProject)),
    filter(project => project !== undefined),
    map(project => project as ReadProject)
  );

  copyrightHolders$ = this.project$.pipe(
    switchMap(project => this._paginatedApi.getCopyrightHolders(project.shortcode))
  );

  authorships$ = this.project$.pipe(switchMap(project => this._paginatedApi.getAuthorships(project.shortcode)));

  constructor(
    private _dialog: MatDialog,
    private _paginatedApi: PaginatedApiService,
    private _store: Store
  ) {}

  addCopyrightHolder() {
    const currentProject = this._store.selectSnapshot(ProjectsSelectors.currentProject);
    if (!currentProject) {
      throw new AppError('No current project');
    }
    this._dialog
      .open<CreateCopyrightHolderDialogComponent, CreateCopyrightHolderDialogProps, boolean>(
        CreateCopyrightHolderDialogComponent,
        { data: { projectShortcode: currentProject.shortcode } }
      )
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this._reloadSubject.next();
        }
      });
  }
}
