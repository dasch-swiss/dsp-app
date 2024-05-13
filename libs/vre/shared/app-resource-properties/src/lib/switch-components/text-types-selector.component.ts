import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Constants, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-text-types-selector',
  template: ` <div [ngSwitch]="prop.guiElement">
    <app-text-switch *ngSwitchCase="text" [control]="control" [displayMode]="displayMode"></app-text-switch>
  </div>`,
})
export class TextTypesSelectorComponent {
  @Input() control!: FormControl<string | null>;
  @Input() displayMode = true;
  @Input() prop!: ResourcePropertyDefinition;

  readonly text = Constants.TextValue;
  readonly xml = Constants.TextValueAsXml;
}
