import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Constants } from '@dasch-swiss/dsp-js';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';
import {
    FormControl,
    FormsModule,
    ReactiveFormsModule,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { AppDatePickerModule } from '@dasch-swiss/vre/shared/app-date-picker';
import { ResourceLabel } from '../../../data-access/advanced-search-service/advanced-search.service';
@Component({
    selector: 'dasch-swiss-property-form-value',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatInputModule,
        MatMenuModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        AppDatePickerModule,
    ],
    templateUrl: './property-form-value.component.html',
    styleUrls: ['./property-form-value.component.scss'],
})
export class PropertyFormValueComponent implements OnInit {
    @Input() objectType: string | undefined = '';

    @Output() emitValueChanged = new EventEmitter<string>();

    constants = Constants;
    resourceLabel = ResourceLabel;

    matcher = new ValueErrorStateMatcher();
    inputControl = new FormControl();

    ngOnInit() {
        this.inputControl.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((value) => this._emitValueChanged(value));

        this.inputControl.setValidators(this._getValidators(this.objectType));
    }

    onDateSelected(value: string) {
        this.inputControl.setValue(value);
    }

    private _getValidators(objectType: string | undefined): ValidatorFn[] {
        const validators: ValidatorFn[] = [];

        switch (objectType) {
            case Constants.DecimalValue:
                validators.push(Validators.pattern(CustomRegex.DECIMAL_REGEX));
                break;

            case Constants.IntValue:
                validators.push(Validators.pattern(CustomRegex.INT_REGEX));
                break;

            case Constants.UriValue:
                validators.push(Validators.pattern(CustomRegex.URI_REGEX));
                break;
        }

        return validators;
    }

    private _emitValueChanged(value: string) {
        // value could be 0 in the case of a number
        if (this.inputControl.valid && value !== null && value !== undefined)
            this.emitValueChanged.emit(value.toString().trim());
        else this.emitValueChanged.emit(undefined);
    }
}

class ValueErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null): boolean {
        if (!control) {
            return false;
        }
        return control && control.invalid && (control.dirty || control.touched);
    }
}

class CustomRegex {
    public static readonly INT_REGEX = /^-?\d+$/;

    public static readonly DECIMAL_REGEX = /^[-+]?[0-9]*\.?[0-9]*$/;

    public static readonly URI_REGEX =
        /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,63}(:[0-9]{1,5})?(\/.*)?$/;
}
