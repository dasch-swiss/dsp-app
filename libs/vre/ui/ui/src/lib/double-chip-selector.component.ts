import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatChipListbox, MatChipListboxChange } from '@angular/material/chips';

@Component({
  selector: 'app-double-chip-selector',
  template: ` <mat-chip-listbox
    aria-label="File source"
    style="margin-bottom: 8px; margin-top: 8px"
    [required]="true"
    [value]="value"
    (change)="change($event)">
    <mat-chip-option [value]="true">{{ options[0] }}</mat-chip-option>
    <mat-chip-option [value]="false">{{ options[1] }}</mat-chip-option>
  </mat-chip-listbox>`,
})
export class DoubleChipSelectorComponent {
  @Input({ required: true }) value!: boolean;
  @Input({ required: true }) options!: [string, string];
  @Output() valueChange = new EventEmitter<boolean>();

  @ViewChild(MatChipListbox) matChipListbox!: MatChipListbox;

  change(event: MatChipListboxChange) {
    if (event.value === undefined) {
      this.matChipListbox.value = this.value;
      return;
    }
    this.valueChange.emit(!this.value);
  }
}
