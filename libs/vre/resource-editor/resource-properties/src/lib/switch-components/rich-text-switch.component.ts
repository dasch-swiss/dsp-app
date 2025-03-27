import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-rich-text-switch',
  template: ` <app-rich-text-viewer *ngIf="displayMode; else editMode" [control]="control" />
    <ng-template #editMode>
      <app-ck-editor [control]="myControl" />
    </ng-template>`,
  styles: [
    `
      :host ::ng-deep footnote {
        font-size: 0.8em;
        vertical-align: super;
        visibility: visible;
        position: relative;
        top: -6px;
        left: 2px;
        color: #336790;
        cursor: pointer;
        display: inline-block;
        padding: 0 2px;
      }
    `,
  ],
})
export class RichTextSwitchComponent implements IsSwitchComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() displayMode = true;

  get myControl() {
    return this.control as FormControl<string>;
  }
}
