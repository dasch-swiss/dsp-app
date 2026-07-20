import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { LegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { ProjectDataRightsService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { AuthorshipChipEditorComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, Observable, startWith } from 'rxjs';

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
  selector: 'app-resource-side-legal-form',
  template: `
    <section class="section">
      <div style="display: flex; justify-content: center; margin: 16px 0">
        <div role="status" style="border: 1px solid; padding: 16px">
          {{ 'legal.dataSide.settings.liveWarning' | translate }}
        </div>
      </div>

      <form [formGroup]="form">
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
          <input matInput formControlName="copyrightHolder" autocomplete="off" [placeholder]="project.longname ?? ''" />
          @if (canPrefillLongname()) {
            <button
              matSuffix
              mat-icon-button
              type="button"
              [attr.aria-label]="'legal.dataSide.settings.useLongnameAria' | translate: { name: project.longname }"
              [matTooltip]="'legal.dataSide.settings.useLongname' | translate"
              (click)="acceptLongnameSuggestion()">
              <mat-icon>content_paste_go</mat-icon>
            </button>
          }
          <mat-hint>{{ 'legal.dataSide.settings.holderHelper' | translate }}</mat-hint>
        </mat-form-field>

        <app-authorship-chip-editor
          [control]="form.controls.dataAuthorship"
          [label]="'legal.dataSide.authorship' | translate"
          [ariaLabel]="'legal.dataSide.authorship' | translate"
          [hint]="'legal.dataSide.authorshipHint' | translate"
          [removeAuthorLabel]="removeAuthorLabel" />

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px">
          <button type="button" mat-button (click)="cancel()">
            {{ 'legal.dataSide.settings.cancel' | translate }}
          </button>
          <button
            type="button"
            mat-raised-button
            color="primary"
            [disabled]="form.pristine || form.invalid || saving"
            (click)="save()">
            {{ 'legal.dataSide.settings.save' | translate }}
          </button>
        </div>
      </form>
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
    AsyncPipe,
    AuthorshipChipEditorComponent,
    MatButton,
    MatFormFieldModule,
    MatIcon,
    MatIconButton,
    MatInputModule,
    MatSelectModule,
    MatTooltip,
    ReactiveFormsModule,
    TranslatePipe,
  ],
})
export class ResourceSideLegalFormComponent implements OnInit {
  @Input({ required: true }) project!: ReadProject;
  @Output() saved = new EventEmitter<void>();

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dataRights = inject(ProjectDataRightsService);
  private readonly _legalInfoApi = inject(LegalInfoApiService);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);

  form!: ResourceSideForm;
  ccLicenses$!: Observable<CcLicenseOption[]>;
  saving = false;

  ngOnInit(): void {
    this.form = new FormGroup({
      license: new FormControl<string | null>(this.project.dataLicense ?? null),
      copyrightHolder: new FormControl<string | null>(this.project.dataCopyrightHolder ?? null),
      dataAuthorship: new FormControl<string[]>(this.project.defaultDataAuthorship ?? [], { nonNullable: true }),
    });

    // Seed the dropdown with the already-selected license so mat-select can render its label
    // immediately, before the (uncached) license catalog request resolves. Otherwise the field
    // shows blank for a round-trip, because mat-select only renders a selected value's label once a
    // matching <mat-option> exists. The label comes from the static CC_BY_SUMMARY_KEYS map, so the
    // seed needs no network. The fetched list then supersedes it. See DEV-6763.
    const preselected = this.project.dataLicense ? [this._toCcLicenseOption(this.project.dataLicense)] : [];

    this.ccLicenses$ = this._legalInfoApi.getLicenses(this.project.shortcode).pipe(
      map(licenses =>
        licenses.filter(l => l.id.startsWith(CC_BY_IRI_PREFIX)).map(l => this._toCcLicenseOption(l.id, l.labelEn))
      ),
      startWith(preselected)
    );
  }

  /**
   * Maps a license IRI to a dropdown option. The CC-BY family label comes from the static
   * CC_BY_SUMMARY_KEYS map (translated in the template), so a preselected license can be shown
   * without waiting for the catalog fetch; `fallbackLabel` (the API's labelEn) is only used for
   * licenses not registered in that map.
   */
  private _toCcLicenseOption(iri: string, fallbackLabel = ''): CcLicenseOption {
    return { iri, summaryKey: CC_BY_SUMMARY_KEYS[iri], fallbackLabel };
  }

  /** Builds the per-chip remove-button aria-label; arrow so it binds correctly when passed as an @Input. */
  readonly removeAuthorLabel = (name: string): string =>
    this._translate.instant('legal.dataSide.removeAuthor', { name });

  cancel(): void {
    this.form.reset({
      license: this.project.dataLicense ?? null,
      copyrightHolder: this.project.dataCopyrightHolder ?? null,
      dataAuthorship: this.project.defaultDataAuthorship ?? [],
    });
  }

  canPrefillLongname(): boolean {
    return !!this.project.longname && !this.form.controls.copyrightHolder.value;
  }

  acceptLongnameSuggestion(): void {
    const ctrl = this.form.controls.copyrightHolder;
    ctrl.setValue(this.project.longname!);
    ctrl.markAsDirty();
  }

  save(): void {
    const { license, copyrightHolder, dataAuthorship } = this.form.getRawValue();
    this.saving = true;
    this._dataRights
      .updateResourceSideLegalInfo(this.project.shortcode, {
        dataLicense: license ?? undefined,
        // Omit an empty holder so the PUT clears it (the endpoint replaces, so a missing field ⇒ None).
        // Sending "" instead would be rejected by the CopyrightHolder value object (must be non-empty).
        dataCopyrightHolder: copyrightHolder?.trim() ? copyrightHolder : undefined,
        defaultDataAuthorship: dataAuthorship ?? [],
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.saving = false;
          this.form.markAsPristine();
          this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saved'));
          this.saved.emit();
        },
        error: () => {
          this.saving = false;
          this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saveError'));
        },
      });
  }
}
