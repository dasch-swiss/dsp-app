import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Cardinality } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-required-slide-toggle',
  template: `
    <mat-slide-toggle
      [matTooltip]="'The property in this class must have one value'"
      matTooltipPosition="above"
      [disabled]="disabled"
      [checked]="checked"
      (change)="toggleRequired()">
      {{ label }}
    </mat-slide-toggle>
  `,
})
export class RequiredSlideToggleComponent {
  @Input({ required: true }) control!: FormControl<Cardinality>;
  @Input() label?: string;
  @Input() disabled = false;
  @Output() afterCardinalityChange = new EventEmitter<Cardinality>();

  get checked() {
    return this.control.value === Cardinality._1 || this.control.value === Cardinality._1_n;
  }

  toggleRequired() {
    const requiredToggle = new Map<Cardinality, Cardinality>([
      [Cardinality._1, Cardinality._0_1],
      [Cardinality._0_1, Cardinality._1],
      [Cardinality._0_n, Cardinality._1_n],
      [Cardinality._1_n, Cardinality._0_n],
    ]);
    this.afterCardinalityChange.emit(requiredToggle.get(this.control.getRawValue()));
  }
}
