import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-rich-text-switch',
  template: ` <div *ngIf="displayMode; else editMode" [innerHTML]="control.value" appHtmlLink></div>
    <ng-template #editMode>
      <app-rich-text-value [control]="myControl"></app-rich-text-value>
    </ng-template>`,
})
export class RichTextSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormControl<string | null>;
  @Input() displayMode = true;

  get myControl() {
    return this.control as FormControl<string>;
  }
}
