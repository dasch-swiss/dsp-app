import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { AlternatedListComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, first, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import {
  CreateCopyrightHolderDialogComponent,
  CreateCopyrightHolderDialogProps,
} from '../create-copyright-holder-dialog.component';
import { LegalSettingsLicensesComponent } from './legal-settings-licenses.component';

/** The Creative Commons licenses allowed as a project's data-side license (CC-BY family only; CC0/PDM excluded). */
const CC_LICENSES: { iri: string; summaryKey: string }[] = [
  { iri: 'http://rdfh.ch/licenses/cc-by-4.0', summaryKey: 'ccBy40' },
  { iri: 'http://rdfh.ch/licenses/cc-by-sa-4.0', summaryKey: 'ccBySa40' },
  { iri: 'http://rdfh.ch/licenses/cc-by-nc-4.0', summaryKey: 'ccByNc40' },
  { iri: 'http://rdfh.ch/licenses/cc-by-nc-sa-4.0', summaryKey: 'ccByNcSa40' },
  { iri: 'http://rdfh.ch/licenses/cc-by-nd-4.0', summaryKey: 'ccByNd40' },
  { iri: 'http://rdfh.ch/licenses/cc-by-nc-nd-4.0', summaryKey: 'ccByNcNd40' },
];

type ResourceSideForm = FormGroup<{
  license: FormControl<string | null>;
  copyrightHolder: FormControl<string | null>;
  dataAuthorship: FormControl<string[]>;
}>;

@Component({
  selector: 'app-legal-settings',
  template: `
    <mat-tab-group animationDuration="0ms" [mat-stretch-tabs]="false" mat-align-tabs="center" class="legal-side-tabs">
      <mat-tab [label]="'legal.dataSide.settings.resourceSide' | translate">
        <section class="section">
          <div style="display: flex; justify-content: center; margin: 16px 0">
            <div role="note" style="border: 1px solid; padding: 16px">
              {{ 'legal.dataSide.settings.liveWarning' | translate }}
            </div>
          </div>

          <form [formGroup]="resourceSideForm">
            <mat-form-field style="width: 100%">
              <mat-label>{{ 'legal.dataSide.license' | translate }}</mat-label>
              <mat-select
                formControlName="license"
                [placeholder]="'legal.dataSide.settings.licensePlaceholder' | translate">
                <mat-option [value]="null">{{ 'resourceEditor.resourceCreator.legal.none' | translate }}</mat-option>
                @for (lic of ccLicenses; track lic.iri) {
                  <mat-option [value]="lic.iri">{{
                    'legal.dataSide.summaries.' + lic.summaryKey | translate
                  }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <p class="mat-caption" style="margin: 0 0 4px">{{ 'legal.dataSide.settings.holderHelper' | translate }}</p>
            <mat-form-field style="width: 100%">
              <mat-label>{{ 'legal.dataSide.settings.holderLabel' | translate }}</mat-label>
              <input matInput formControlName="copyrightHolder" autocomplete="off" />
            </mat-form-field>

            <!-- TODO(verify-locally): mat-chips wiring (version-specific API for chip-grid + input token end). -->
            <mat-form-field style="width: 100%">
              <mat-label>{{ 'legal.dataSide.authorship' | translate }}</mat-label>
              <mat-chip-grid #chipGrid>
                @for (author of resourceSideForm.controls.dataAuthorship.value; track $index) {
                  <mat-chip-row (removed)="removeAuthor($index)">
                    {{ author }}
                    <button
                      type="button"
                      matChipRemove
                      [attr.aria-label]="'legal.dataSide.removeAuthor' | translate: { name: author }">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                }
                <input
                  autocomplete="off"
                  [matChipInputFor]="chipGrid"
                  (matChipInputTokenEnd)="addAuthor($event.value); $event.chipInput!.clear()" />
              </mat-chip-grid>
            </mat-form-field>

            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px">
              <button type="button" mat-button (click)="resetResourceSide()">
                {{ 'legal.dataSide.settings.cancel' | translate }}
              </button>
              <button
                type="button"
                mat-raised-button
                color="primary"
                [disabled]="resourceSideForm.pristine || saving"
                (click)="saveResourceSide()">
                {{ 'legal.dataSide.settings.save' | translate }}
              </button>
            </div>
          </form>
        </section>
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
    MatButton,
    MatChipsModule,
    MatFormFieldModule,
    MatIcon,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltip,
    ReactiveFormsModule,
    TranslatePipe,
  ],
})
export class LegalSettingsComponent implements OnInit {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);

  saving = false;
  readonly ccLicenses = CC_LICENSES;

  readonly resourceSideForm: ResourceSideForm = new FormGroup({
    license: new FormControl<string | null>(null),
    copyrightHolder: new FormControl<string | null>(null),
    dataAuthorship: new FormControl<string[]>([], { nonNullable: true }),
  });

  readonly project$ = this._reloadSubject
    .asObservable()
    .pipe(switchMap(() => this._projectPageService.currentProject$));

  copyrightHolders$ = this.project$.pipe(
    switchMap(project => this._paginatedApi.getCopyrightHolders(project.shortcode))
  );

  authorships$ = this.project$.pipe(switchMap(project => this._paginatedApi.getAuthorships(project.shortcode)));

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _notification: NotificationService,
    private readonly _paginatedApi: PaginatedApiService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.project$.pipe(first()).subscribe(() => this.resetResourceSide());
  }

  resetResourceSide(): void {
    const project = this._projectPageService.currentProject;
    this.resourceSideForm.reset({
      license: project.dataLicense ?? null,
      // Pre-fill the holder from the official project name when not yet set.
      copyrightHolder: project.dataCopyrightHolder ?? project.longname ?? null,
      dataAuthorship: project.dataAuthorship ?? [],
    });
  }

  addAuthor(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const control = this.resourceSideForm.controls.dataAuthorship;
    control.setValue([...control.value, trimmed]);
    control.markAsDirty();
  }

  removeAuthor(index: number): void {
    const control = this.resourceSideForm.controls.dataAuthorship;
    control.setValue(control.value.filter((_, i) => i !== index));
    control.markAsDirty();
  }

  saveResourceSide(): void {
    const shortcode = this._projectPageService.currentProject.shortcode;
    const { license, copyrightHolder, dataAuthorship } = this.resourceSideForm.getRawValue();
    this.saving = true;
    this._paginatedApi
      .updateResourceSideLegalInfo(shortcode, {
        dataLicense: license ?? undefined,
        dataCopyrightHolder: copyrightHolder ?? undefined,
        dataAuthorship: dataAuthorship ?? [],
      })
      .subscribe({
        next: () => {
          this.saving = false;
          // Back to pristine so the Save button greys out again until the next edit.
          this.resourceSideForm.markAsPristine();
          this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saved'));
          this._reloadSubject.next();
          this._projectPageService.reloadProject();
        },
        error: () => {
          this.saving = false;
          this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saveError'));
        },
      });
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
