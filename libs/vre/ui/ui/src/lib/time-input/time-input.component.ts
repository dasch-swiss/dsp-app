import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HumanReadableErrorPipe } from '../human-readable-error.pipe';
import { ValidatorError } from '../validator-error.interface';
import { TimeFormatDirective } from './time-format.directive';
import { TimeInputErrorStateMatcher } from './time-input-error-state-matcher';

// TODO this changes segment-dialog
@Component({
  selector: 'app-time-input',
  template: `
    <mat-form-field style="width: 100%">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [errorStateMatcher]="errorStateMatcher"
        [formControl]="control"
        appTimeFormat
        [placeholder]="'ui.timeInput.placeholder' | translate" />
      @if (control.errors; as errors) {
        <mat-error>
          {{ errors | humanReadableError: possibleErrors }}
        </mat-error>
      }
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HumanReadableErrorPipe,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TimeFormatDirective,
    TranslateModule,
  ],
  standalone: true,
})
export class TimeInputComponent implements OnInit {
  private readonly _translateService = inject(TranslateService);

  @Input({ required: true }) control!: FormControl<number | null>;
  @Input({ required: true }) label!: string;

  possibleErrors!: ValidatorError[];
  readonly errorStateMatcher = new TimeInputErrorStateMatcher();

  ngOnInit() {
    this.possibleErrors = [
      {
        errorKey: 'pattern',
        message: this._translateService.instant('ui.timeInput.invalidFormat'),
      },
    ];
  }
}
