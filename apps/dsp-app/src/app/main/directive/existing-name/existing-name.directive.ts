/* eslint-disable @typescript-eslint/no-use-before-define */
import { Directive, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Validators, AbstractControl, ValidatorFn } from '@angular/forms';

@Directive({
    selector: '[appExistingNames]',
})
export class ExistingNameDirective implements Validators, OnChanges {
    @Input() existingName: string;

    private _valFn = Validators.nullValidator;

    /**
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        const change = changes['existingName'];
        if (change) {
            const val: string | RegExp = change.currentValue;
            const re = val instanceof RegExp ? val : new RegExp(val);
            this._valFn = existingNameValidator(re);
        } else {
            this._valFn = Validators.nullValidator;
        }
    }

    /**
     * @param control
     */
    validate(control: AbstractControl): { [key: string]: any } {
        return this._valFn(control);
    }
}

/**
 * validation of existing name value. String method (only one value);
 * Use it in a "formbuilder" group as a validator property
 *
 * @param {RegExp} valRegexp Only one regular expression value
 * @returns ValidatorFn
 */
export function existingNameValidator(valRegexp: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
        let name;

        if (control.value) {
            name = control.value.toLowerCase();
        }

        const no = valRegexp.test(name);
        return no ? { existingName: { name } } : null;
    };
}

/**
 * validation of existing name values. Array method (list of values)
 * Use it in a "formbuilder" group as a validator property
 *
 * @param {RegExp} valArrayRegexp List of regular expression values
 * @returns ValidatorFn
 */
export function existingNamesValidator(valArrayRegexp: [RegExp]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
        let name;

        if (control.value) {
            name = control.value.toLowerCase();
        }

        let no;
        for (const existing of valArrayRegexp) {
            no = existing.test(name);
            if (no) {
                return no ? { existingName: { name } } : null;
            }
        }
        return no ? { existingName: { name } } : null;
    };
}

/**
 * @param {RegExp} pattern
 * @returns ValidatorFn
 */
export function notAllowed(pattern: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
        let name;

        if (control.value) {
            name = control.value.toLowerCase();
        }

        const no = pattern.test(name);
        return no ? { regType: { name } } : null;
    };
}
