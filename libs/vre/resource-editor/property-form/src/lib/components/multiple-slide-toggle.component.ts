import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Cardinality } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-multiple-slide-toggle',
  template: ` <mat-slide-toggle
    [matTooltip]="'The property in this class can have multiple values'"
    matTooltipPosition="above"
    [disabled]="disabled"
    [checked]="checked"
    (change)="toggle()">
    {{ label }}
  </mat-slide-toggle>`,
})
export class MultipleSlideToggleComponent {
  @Input({ required: true }) control!: FormControl<Cardinality>;
  @Input() label?: string;
  @Input() disabled = false;
  @Output() afterCardinalityChange = new EventEmitter<Cardinality>();
  protected readonly Cardinality = Cardinality;

  get checked() {
    return [Cardinality._0_n, Cardinality._1_n].includes(this.control.value);
  }

  toggle() {
    const multipleToggle = new Map<Cardinality, Cardinality>([
      [Cardinality._1, Cardinality._1_n],
      [Cardinality._0_1, Cardinality._0_n],
      [Cardinality._0_n, Cardinality._0_1],
      [Cardinality._1_n, Cardinality._1],
    ]);
    this.afterCardinalityChange.emit(multipleToggle.get(this.control.getRawValue()));
  }
}
