import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroupDirective, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { startWith } from 'rxjs/operators';
import { Crs, CRS_84, CRS_LIST, crsByIri, GeolocationFormValue, ordinateOutOfRange } from './geolocation-crs';

const I18N = 'resourceEditor.templateSwitcher.geolocationValue';

/**
 * REQ-3.5 asks for inline feedback. Material's default matcher only surfaces an error once the field
 * has been touched, so an out-of-range coordinate would stay silent until the user left the field.
 */
class ShowErrorWhileTypingMatcher extends ErrorStateMatcher {
  override isErrorState(control: AbstractControl | null, _form: FormGroupDirective | NgForm | null): boolean {
    return !!control?.invalid;
  }
}

@Component({
  selector: 'app-geolocation-value',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <mat-form-field>
      <mat-label>{{ '${I18N}.crsLabel' | translate }}</mat-label>
      <mat-select data-cy="crs-select" [formControl]="crsControl">
        @for (crs of crsList; track crs.iri) {
          <mat-option [value]="crs.iri" [attr.data-cy]="'crs-option-' + crs.iri">{{
            crs.labelKey | translate
          }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <mat-form-field>
      <mat-label>{{ selectedCrs.xLabelKey | translate }}</mat-label>
      <!-- type="text", not type="number": a number input would round-trip 8.550 as 8.55. -->
      <input matInput type="text" data-cy="x-input" [formControl]="xControl" />
      @if (xOutOfRange; as violated) {
        <mat-error data-cy="x-error">{{
          '${I18N}.outOfRange'
            | translate
              : {
                  ordinate: selectedCrs.xLabelKey | translate,
                  crs: selectedCrs.labelKey | translate,
                  min: violated.min,
                  max: violated.max,
                }
        }}</mat-error>
      }
    </mat-form-field>

    <mat-form-field>
      <mat-label>{{ selectedCrs.yLabelKey | translate }}</mat-label>
      <input matInput type="text" data-cy="y-input" [formControl]="yControl" />
      @if (yOutOfRange; as violated) {
        <mat-error data-cy="y-error">{{
          '${I18N}.outOfRange'
            | translate
              : {
                  ordinate: selectedCrs.yLabelKey | translate,
                  crs: selectedCrs.labelKey | translate,
                  min: violated.min,
                  max: violated.max,
                }
        }}</mat-error>
      }
    </mat-form-field>

    @if (crsChangedWithoutCoordinates) {
      <p class="reinterpretation-warning" data-cy="crs-reinterpretation-warning">
        {{ '${I18N}.reinterpretationWarning' | translate }}
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      mat-form-field {
        width: 100%;
      }

      .reinterpretation-warning {
        color: var(--mat-sys-error, #b3261e);
      }
    `,
  ],
  providers: [{ provide: ErrorStateMatcher, useClass: ShowErrorWhileTypingMatcher }],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class GeolocationValueComponent implements OnInit {
  @Input({ required: true }) control!: FormControl<GeolocationFormValue | null>;

  readonly crsList = CRS_LIST;

  crsControl = new FormControl<string>(CRS_84.iri, { nonNullable: true });
  // Strings, not numbers, end to end: a number control would round-trip 8.550 as 8.55 and silently
  // defeat the server's precision guarantee.
  xControl = new FormControl<string>('', { nonNullable: true });
  yControl = new FormControl<string>('', { nonNullable: true });

  /** The CRS and coordinates the value was opened with, so a change of CRS alone can be detected. */
  private _initialCrs: string | null = null;
  private _initialCoordinates: string | null = null;

  get selectedCrs(): Crs {
    return crsByIri(this.crsControl.value) ?? CRS_84;
  }

  get xOutOfRange() {
    return ordinateOutOfRange(this.selectedCrs, 'x', this.xControl.value);
  }

  get yOutOfRange() {
    return ordinateOutOfRange(this.selectedCrs, 'y', this.yControl.value);
  }

  /**
   * REQ-3.4: changing the CRS reinterprets the coordinates, it does not convert them. Warn while the
   * ordinates still hold the values the editor was opened with.
   */
  get crsChangedWithoutCoordinates(): boolean {
    return (
      this._initialCrs !== null &&
      this.crsControl.value !== this._initialCrs &&
      `${this.xControl.value} ${this.yControl.value}` === this._initialCoordinates
    );
  }

  ngOnInit() {
    let updating = false;

    this.control.valueChanges.pipe(startWith(this.control.value)).subscribe(change => {
      if (updating) {
        return;
      }
      updating = true;

      if (change === null) {
        this.xControl.setValue('', { emitEvent: false });
        this.yControl.setValue('', { emitEvent: false });
      } else {
        // REQ-3.2: the selector opens on the value's own CRS, never on a default — getting this wrong
        // silently relabels a Swiss coordinate as WGS84.
        this.crsControl.setValue(change.crs, { emitEvent: false });
        this.xControl.setValue(change.x, { emitEvent: false });
        this.yControl.setValue(change.y, { emitEvent: false });
        if (this._initialCrs === null) {
          this._initialCrs = change.crs;
          this._initialCoordinates = `${change.x} ${change.y}`;
        }
      }
      this._applyRangeErrors();
      updating = false;
    });

    // The two-way sync loops without this guard; it is copied from IntervalValueComponent for that
    // reason.
    const push = () => {
      if (updating) {
        return;
      }
      updating = true;

      const x = this.xControl.value;
      const y = this.yControl.value;
      if (x.trim() !== '' && y.trim() !== '') {
        this.control.patchValue({ crs: this.crsControl.value, x, y });
      } else {
        this.control.patchValue(null);
      }
      this._applyRangeErrors();

      updating = false;
    };

    this.crsControl.valueChanges.subscribe(push);
    this.xControl.valueChanges.subscribe(push);
    this.yControl.valueChanges.subscribe(push);
  }

  /**
   * REQ-3.5: an out-of-range coordinate must block submission, so the error goes onto the controls,
   * not only into the rendered message.
   */
  private _applyRangeErrors() {
    this.xControl.setErrors(this.xOutOfRange === null ? null : { outOfRange: this.xOutOfRange }, { emitEvent: false });
    this.yControl.setErrors(this.yOutOfRange === null ? null : { outOfRange: this.yOutOfRange }, { emitEvent: false });
    const invalid = this.xControl.errors !== null || this.yControl.errors !== null;
    this.control.setErrors(invalid ? { outOfRange: true } : null, { emitEvent: false });
  }
}
