import { ENTER, TAB } from '@angular/cdk/keycodes';
import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInput, MatChipInputEvent } from '@angular/material/chips';
import { AdminProjectsLegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-authorship-form-field',
  template: `
    <mat-form-field style="width: 100%">
      <mat-label>Authorship</mat-label>
      <mat-chip-grid #chipGrid aria-label="Authorship">
        <mat-chip-row *ngFor="let authorship of selectedItems" (removed)="removeItem(authorship)">
          {{ authorship }}
          <button matChipRemove [attr.aria-label]="'remove ' + authorship">
            <mat-icon>cancel</mat-icon>
          </button>
        </mat-chip-row>
      </mat-chip-grid>

      <input
        placeholder="New authorship..."
        data-cy="authorship-chips"
        #test
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
        (matChipInputTokenEnd)="addItemFromMaterial($event)" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectItem($event)">
        <mat-option *ngFor="let option of availableAuthorship" [value]="option">
          {{ option }}
        </mat-option>

        <mat-option>AI-Generated Content – Not Protected by Copyright</mat-option>

        <mat-option>Public Domain – Not Protected by Copyright</mat-option>
      </mat-autocomplete>
      <mat-hint>Press Enter or Tab to add an item.</mat-hint>

      <mat-error *ngIf="control.invalid && control.touched && control.errors![0] as error">
        {{ error | humanReadableError }}
      </mat-error>
    </mat-form-field>
  `,
})
export class AuthorshipFormFieldComponent implements OnInit {
  @Input() control!: FormControl<string[] | null>;
  @Input({ required: true }) projectShortcode!: string;
  @ViewChild(MatChipInput, { static: true }) chipInput!: MatChipInput;

  readonly separatorKeysCodes: number[] = [ENTER, TAB];
  selectedItems: string[] = [];
  availableAuthorship: string[] = [];
  loading = true;

  constructor(
    private _adminApi: AdminProjectsLegalInfoApiService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._adminApi
      .getAdminProjectsShortcodeProjectshortcodeLegalInfoAuthorships(this.projectShortcode)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        this.availableAuthorship = response.data;
      });
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
}
