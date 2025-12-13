import { ENTER, TAB } from '@angular/cdk/keycodes';
import { ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInput, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-authorship-form-field',
  template: `
    <mat-form-field style="width: 100%">
      <mat-label>{{ 'resourceEditor.resourceCreator.authorship.label' | translate }}</mat-label>
      <mat-chip-grid #chipGrid [attr.aria-label]="'resourceEditor.resourceCreator.authorship.label' | translate">
        @for (authorship of selectedItems; track authorship) {
          <mat-chip-row (removed)="removeItem(authorship)">
            {{ authorship }}
            <button
              matChipRemove
              [attr.aria-label]="
                _translateService.instant('resourceEditor.resourceCreator.authorship.removeItem', { name: authorship })
              ">
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        }
      </mat-chip-grid>

      <input
        [placeholder]="'resourceEditor.resourceCreator.authorship.placeholder' | translate"
        data-cy="authorship-chips"
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        [matAutocompleteDisabled]="filteredAuthorship.length === 0"
        [formControl]="autocompleteFormControl"
        [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
        (matChipInputTokenEnd)="addItemFromMaterial($event)" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectItem($event)">
        @for (option of filteredAuthorship; track option) {
          <mat-option [value]="option">
            {{ option }}
          </mat-option>
        }

        @if (
          filteredAuthorship.length === 0 && autocompleteFormControl.value && autocompleteFormControl.value.length > 0
        ) {
          <mat-option [disabled]="true">{{
            'resourceEditor.resourceCreator.authorship.pressEnterOrTab' | translate
          }}</mat-option>
        }
      </mat-autocomplete>

      @if (control.invalid && control.touched && control.errors![0]; as error) {
        <mat-error>
          {{ error | humanReadableError }}
        </mat-error>
      }
    </mat-form-field>
  `,
  imports: [
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslateModule,
    HumanReadableErrorPipe,
    HumanReadableErrorPipe,
  ],
})
export class AuthorshipFormFieldComponent implements OnInit, OnDestroy {
  @Input() control!: FormControl<string[] | null>;
  @Input({ required: true }) projectShortcode!: string;
  @ViewChild(MatChipInput, { static: true }) chipInput!: MatChipInput;

  readonly separatorKeysCodes: number[] = [ENTER, TAB];
  selectedItems: string[] = [];
  availableAuthorship: string[] = [];
  filteredAuthorship: string[] = [];
  loading = true;
  subscription!: Subscription;
  autocompleteFormControl = new FormControl('');

  readonly AIAuthorship = 'AI-Generated Content – Not Protected by Copyright';
  readonly publicDomainAuthorship = 'Public Domain – Not Protected by Copyright';

  readonly _translateService = inject(TranslateService);

  constructor(
    private readonly _paginatedApi: PaginatedApiService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._paginatedApi
      .getAuthorships(this.projectShortcode)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        this.availableAuthorship = this._addMissingDefaultValues(response);
        this.filteredAuthorship = this.availableAuthorship;
      });

    this.subscription = this.autocompleteFormControl.valueChanges.subscribe(value => {
      if (value) {
        this.filteredAuthorship = this.availableAuthorship.filter(authorship =>
          authorship.toLowerCase().includes(value.toLowerCase())
        );
      } else {
        this.filteredAuthorship = this.availableAuthorship;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  addItemFromMaterial(event: MatChipInputEvent) {
    this._addItem(event.value.trim());
  }

  selectItem(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.viewValue;
    if (!this.selectedItems.includes(selectedValue)) {
      this.selectedItems.push(selectedValue);
      this._updateFormControl();
    }
    this.chipInput.clear();
  }

  removeItem(item: string) {
    this.selectedItems = this.selectedItems.filter(i => i !== item);
    this._updateFormControl();
  }

  private _addItem(authorship: string) {
    this.autocompleteFormControl.setValue(null);
    this.chipInput.clear();

    if (authorship === '' || this.selectedItems.includes(authorship)) {
      return;
    }

    if (!this.availableAuthorship.includes(authorship)) {
      this.availableAuthorship.push(authorship);
    }

    this.selectedItems.push(authorship);

    this._updateFormControl();
    this._cdr.detectChanges();
  }

  private _updateFormControl() {
    this.control.setValue(this.selectedItems);
  }

  private _addMissingDefaultValues(authorship: string[]) {
    if (!authorship.includes(this.AIAuthorship)) {
      authorship.push(this.AIAuthorship);
    }
    if (!authorship.includes(this.publicDomainAuthorship)) {
      authorship.push(this.publicDomainAuthorship);
    }
    return authorship;
  }
}
