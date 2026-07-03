import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { LegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { ProjectDataRightsService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { AlternatedListComponent, AuthorshipChipEditorComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, first, map, Observable, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import {
  CreateCopyrightHolderDialogComponent,
  CreateCopyrightHolderDialogProps,
} from '../create-copyright-holder-dialog.component';
import { LegalSettingsLicensesComponent } from './legal-settings-licenses.component';

/**
 * Localized summary translation keys for the CC-BY family, keyed by license IRI.
 * The dropdown *existence* is driven by `LegalInfoApiService.getLicenses` (filtered to CC-BY);
 * this map only provides the translated label. Licenses not listed here fall back to the API's `labelEn`.
 */
const CC_BY_SUMMARY_KEYS: Record<string, string> = {
  'http://rdfh.ch/licenses/cc-by-4.0': 'ccBy40',
  'http://rdfh.ch/licenses/cc-by-sa-4.0': 'ccBySa40',
  'http://rdfh.ch/licenses/cc-by-nc-4.0': 'ccByNc40',
  'http://rdfh.ch/licenses/cc-by-nc-sa-4.0': 'ccByNcSa40',
  'http://rdfh.ch/licenses/cc-by-nd-4.0': 'ccByNd40',
  'http://rdfh.ch/licenses/cc-by-nc-nd-4.0': 'ccByNcNd40',
};

const CC_BY_IRI_PREFIX = 'http://rdfh.ch/licenses/cc-by';

interface CcLicenseOption {
  iri: string;
  /** Translation key under `legal.dataSide.summaries.*` when known; otherwise `undefined`. */
  summaryKey?: string;
  /** English label from the API, used as a fallback when no translation key is registered. */
  fallbackLabel: string;
}

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
            <div role="status" style="border: 1px solid; padding: 16px">
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
                @for (lic of ccLicenses$ | async; track lic.iri) {
                  <mat-option [value]="lic.iri">
                    @if (lic.summaryKey) {
                      {{ 'legal.dataSide.summaries.' + lic.summaryKey | translate }}
                    } @else {
                      {{ lic.fallbackLabel }}
                    }
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field style="width: 100%" subscriptSizing="dynamic">
              <mat-label>{{ 'legal.dataSide.settings.holderLabel' | translate }}</mat-label>
              <input matInput formControlName="copyrightHolder" autocomplete="off" />
              <mat-hint>{{ 'legal.dataSide.settings.holderHelper' | translate }}</mat-hint>
            </mat-form-field>

            <app-authorship-chip-editor
              [control]="resourceSideForm.controls.dataAuthorship"
              [label]="'legal.dataSide.authorship' | translate"
              [ariaLabel]="'legal.dataSide.authorship' | translate"
              [removeAuthorLabel]="removeAuthorLabel" />

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
    AuthorshipChipEditorComponent,
    LegalSettingsLicensesComponent,
    MatButton,
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

  readonly resourceSideForm: ResourceSideForm = new FormGroup({
    license: new FormControl<string | null>(null),
    copyrightHolder: new FormControl<string | null>(null),
    dataAuthorship: new FormControl<string[]>([], { nonNullable: true }),
  });

  readonly project$ = this._reloadSubject
    .asObservable()
    .pipe(switchMap(() => this._projectPageService.currentProject$));

  /**
   * CC-BY family license options for the dropdown, filtered from the project's license catalog.
   * Existence is API-driven (no drift when the catalog changes); labels use the localized
   * summary translations when known and fall back to the API's `labelEn` otherwise.
   */
  ccLicenses$: Observable<CcLicenseOption[]> = this.project$.pipe(
    switchMap(project => this._legalInfoApi.getLicenses(project.shortcode)),
    map(licenses =>
      licenses
        .filter(l => l.id.startsWith(CC_BY_IRI_PREFIX))
        .map(l => ({ iri: l.id, summaryKey: CC_BY_SUMMARY_KEYS[l.id], fallbackLabel: l.labelEn }))
    )
  );

  copyrightHolders$ = this.project$.pipe(
    switchMap(project => this._legalInfoApi.getCopyrightHolders(project.shortcode))
  );

  authorships$ = this.project$.pipe(switchMap(project => this._legalInfoApi.getAuthorships(project.shortcode)));

  constructor(
    private readonly _dataRights: ProjectDataRightsService,
    private readonly _destroyRef: DestroyRef,
    private readonly _dialog: MatDialog,
    private readonly _notification: NotificationService,
    private readonly _legalInfoApi: LegalInfoApiService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.project$.pipe(first(), takeUntilDestroyed(this._destroyRef)).subscribe(() => this.resetResourceSide());
  }

  resetResourceSide(): void {
    const project = this._projectPageService.currentProject;
    const holderNotYetSet = !project.dataCopyrightHolder;
    this.resourceSideForm.reset({
      license: project.dataLicense ?? null,
      // Pre-fill the holder from the official project name when not yet set.
      copyrightHolder: project.dataCopyrightHolder ?? project.longname ?? null,
      dataAuthorship: project.dataAuthorship ?? [],
    });
    // If we filled the holder from the project name (not from a persisted value), mark the form dirty
    // so Save is enabled and the user can accept the pre-fill with one click.
    if (holderNotYetSet && project.longname) {
      this.resourceSideForm.controls.copyrightHolder.markAsDirty();
    }
  }

  /** Builds the per-chip remove-button aria-label; arrow so it binds correctly when passed as an @Input. */
  readonly removeAuthorLabel = (name: string): string =>
    this._translate.instant('legal.dataSide.removeAuthor', { name });

  saveResourceSide(): void {
    const shortcode = this._projectPageService.currentProject.shortcode;
    const { license, copyrightHolder, dataAuthorship } = this.resourceSideForm.getRawValue();
    this.saving = true;
    this._dataRights
      .updateResourceSideLegalInfo(shortcode, {
        dataLicense: license ?? undefined,
        dataCopyrightHolder: copyrightHolder ?? undefined,
        dataAuthorship: dataAuthorship ?? [],
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
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
