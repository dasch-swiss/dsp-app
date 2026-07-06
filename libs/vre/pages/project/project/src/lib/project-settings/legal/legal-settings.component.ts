import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { LegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AlternatedListComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, first, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import {
  CreateCopyrightHolderDialogComponent,
  CreateCopyrightHolderDialogProps,
} from '../create-copyright-holder-dialog.component';
import { LegalSettingsLicensesComponent } from './legal-settings-licenses.component';
import { ResourceSideLegalFormComponent } from './resource-side-legal-form.component';

@Component({
  selector: 'app-legal-settings',
  template: `
    <mat-tab-group animationDuration="0ms" [mat-stretch-tabs]="false" mat-align-tabs="center" class="legal-side-tabs">
      <mat-tab [label]="'legal.dataSide.settings.resourceSide' | translate">
        @if (project$ | async; as project) {
          <app-resource-side-legal-form [project]="project" (saved)="reload()" />
        }
      </mat-tab>

      <mat-tab [label]="'legal.dataSide.settings.assetSide' | translate">
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
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [
    `
      .section {
        margin-bottom: 48px;
      }
      /* The side switcher sits under the Settings tab bar; give it a little space
         so the two tab strips don't crowd each other (it has no icons, so it already
         reads as the lighter, secondary level). */
      .legal-side-tabs {
        display: block;
        margin-top: 8px;
      }
    `,
  ],
  imports: [
    AlternatedListComponent,
    AsyncPipe,
    LegalSettingsLicensesComponent,
    MatIcon,
    MatTabsModule,
    MatTooltip,
    ResourceSideLegalFormComponent,
    TranslatePipe,
  ],
})
export class LegalSettingsComponent {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);

  readonly project$ = this._reloadSubject
    .asObservable()
    .pipe(switchMap(() => this._projectPageService.currentProject$));

  copyrightHolders$ = this.project$.pipe(
    switchMap(project => this._legalInfoApi.getCopyrightHolders(project.shortcode))
  );

  authorships$ = this.project$.pipe(switchMap(project => this._legalInfoApi.getAuthorships(project.shortcode)));

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _legalInfoApi: LegalInfoApiService,
    private readonly _projectPageService: ProjectPageService
  ) {}

  reload(): void {
    this._reloadSubject.next();
    this._projectPageService.reloadProject();
  }

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
