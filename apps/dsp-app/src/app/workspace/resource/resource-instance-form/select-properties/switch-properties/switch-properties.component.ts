import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Constants, ReadResource, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '../../../../../main/directive/base-value.directive';

@Component({
  selector: 'app-switch-properties',
  templateUrl: './switch-properties.component.html',
  styleUrls: ['./switch-properties.component.scss'],
})
export class SwitchPropertiesComponent implements OnInit {
  @ViewChild('createVal') createValueComponent: BaseValueDirective;

  @Input() property: ResourcePropertyDefinition;

  @Input() parentResource: ReadResource;

  @Input() parentForm: UntypedFormGroup;

  @Input() formName: string;

  @Input() isRequiredProp: boolean;

  @Input() currentOntoIri?: string;

  mode = 'create';

  textArea = false;

  constants = Constants;

  ngOnInit(): void {
    // the input isRequiredProp provided by KeyValuePair is stored as a number
    // a conversion from a number to a boolean is required by the input valueRequiredValidator
    this.isRequiredProp = !!+this.isRequiredProp;

    if (this.property.guiElement === `${Constants.SalsahGui + Constants.HashDelimiter}Textarea`) {
      this.textArea = true;
    }
  }
}
