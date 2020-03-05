import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';

// property data structure
export class Property {

    name: string;
    label: string;
    type: any;
    multiple: boolean;
    required: boolean;
    guiAttr: string;
    // permission: string;

    constructor(
        name?: string,
        label?: string,
        type?: any,
        multiple?: boolean,
        required?: boolean,
        guiAttr?: string
        // permission?: string
    ) {
        this.name = name;
        this.label = label;
        this.type = type;
        this.multiple = multiple;
        this.required = required;
        this.guiAttr = guiAttr;
        // this.permission = permission;
    }
}


// property form controls
export class PropertyForm {
    name = new FormControl();
    label = new FormControl();
    type = new FormControl();
    multiple = new FormControl();
    required = new FormControl();
    guiAttr = new FormControl();
    // permission = new FormControl();

    constructor(
        property: Property
    ) {
        this.name.setValue(property.name);
        this.name.setValidators([Validators.required]);

        this.label.setValue(property.label);
        this.label.setValidators([Validators.required]);

        this.type.setValue(property.type);
        this.type.setValidators([Validators.required]);

        this.multiple.setValue(property.multiple);

        this.required.setValue(property.required);

        this.guiAttr.setValue(property.guiAttr);

        // this.permission.setValue(property.permission);
        // TODO: permission is not implemented yet
        // this.permission.setValidators([Validators.required]);
    }
}

// source type data structure
export class SourceType {
    name: string;
    properties: Property[];

    constructor(name: string, properties?: Property[]) {
        this.name = name;
        this.properties = properties;
    }
}


// source type form controls
export class SourceTypeForm {
    name = new FormControl();
    properties = new FormArray([]);

    constructor(sourceType: SourceType) {
        this.name.setValue(sourceType.name);

        if (sourceType.properties) {
            this.properties.setValue([sourceType.properties]);
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class SourceTypeFormService {

    private sourceTypeForm: BehaviorSubject<FormGroup | undefined> = new BehaviorSubject(this._fb.group(
        new SourceTypeForm(new SourceType(''))
    ));

    sourceTypeForm$: Observable<FormGroup> = this.sourceTypeForm.asObservable();

    constructor(private _fb: FormBuilder) { }

    // reset
    resetProperties() {

        const currentSourceType = this._fb.group(
            new SourceTypeForm(new SourceType(''))
        );

        this.sourceTypeForm.next(currentSourceType);
    }

    addProperty() {
        const currentSourceType = this.sourceTypeForm.getValue();
        const currentProperties = currentSourceType.get('properties') as FormArray;

        currentProperties.push(
            this._fb.group(
                new PropertyForm(new Property('', '', {}, false, false))
            )
        );

        this.sourceTypeForm.next(currentSourceType);
    }

    removeProperty(i: number) {
        const currentSourceType = this.sourceTypeForm.getValue();
        const currentProperties = currentSourceType.get('properties') as FormArray;

        currentProperties.removeAt(i);
        this.sourceTypeForm.next(currentSourceType);
    }
}
