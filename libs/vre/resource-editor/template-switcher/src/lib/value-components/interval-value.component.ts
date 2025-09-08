import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-interval-value',
  template: `
    <app-time-input label="Start" [control]="startControl" data-cy="start-input" />
    <app-time-input label="End" [control]="endControl" data-cy="end-input" />
    @if (control.touched && control.errors; as errors) {
      <mat-error>
        {{ errors | humanReadableError }}
      </mat-error>
    }
  `,
})
export class IntervalValueComponent implements OnInit {
  @Input({ required: true }) control!: FormControl<{ start: number; end: number } | null>;

  startControl = new FormControl(0);
  endControl = new FormControl(0);

  ngOnInit() {
    let updating = false;

    this.control.valueChanges.pipe(startWith(this.control.value)).subscribe(change => {
      if (updating) {
        return;
      }
      updating = true;

      if (change === null) {
        this.startControl.setValue(null, { emitEvent: false });
        this.endControl.setValue(null, { emitEvent: false });
      } else {
        this.startControl.setValue(change.start, { emitEvent: false });
        this.endControl.setValue(change.end, { emitEvent: false });
      }
      updating = false;
    });

    this.startControl.valueChanges.subscribe(start => {
      if (updating) {
        return;
      }
      updating = true;

      if (start !== null && this.endControl.value !== null) {
        this.control.patchValue({ start, end: this.endControl.value });
      } else {
        this.control.patchValue(null);
      }

      updating = false;
    });

    this.endControl.valueChanges.subscribe(end => {
      if (updating) {
        return;
      }
      updating = true;

      if (end !== null && this.startControl.value !== null) {
        this.control.patchValue({ start: this.startControl.value, end });
      } else {
        this.control.patchValue(null);
      }

      updating = false;
    });
  }
}
