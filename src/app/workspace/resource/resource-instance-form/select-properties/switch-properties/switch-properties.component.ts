import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Constants, ReadResource, ResourceClassDefinition, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';
import { ValueService } from '../../../services/value.service';

@Component({
    selector: 'app-switch-properties',
    templateUrl: './switch-properties.component.html',
    styleUrls: ['./switch-properties.component.scss']
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

    // gui element in case of textValue
    textValueGuiEle: 'simpleText' | 'textArea' | 'richText';

    constants = Constants;

    constructor(
        private _valueService: ValueService
    ) { }

    ngOnInit(): void {
        // the input isRequiredProp provided by KeyValuePair is stored as a number
        // a conversion from a number to a boolean is required by the input valueRequiredValidator
        this.isRequiredProp = !!+this.isRequiredProp;

        this.textValueGuiEle = this._valueService.getTextValueGuiEle(this.property.guiElement);
    }

    saveNewValue() {
        const createVal = this.createValueComponent.getNewValue();
    }

}
