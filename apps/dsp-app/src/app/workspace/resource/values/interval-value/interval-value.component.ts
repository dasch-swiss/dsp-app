import {
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';
import {
    CreateIntervalValue,
    ReadIntervalValue,
    UpdateIntervalValue,
} from '@dasch-swiss/dsp-js';
import { FormBuilder } from '@angular/forms';
import {
    Interval,
    IntervalInputComponent,
} from './interval-input/interval-input.component';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';

@Component({
    selector: 'app-interval-value',
    templateUrl: './interval-value.component.html',
    styleUrls: ['./interval-value.component.scss'],
})
export class IntervalValueComponent
    extends BaseValueDirective
    implements OnInit, OnChanges, OnDestroy
{
    @ViewChild('intervalInput') intervalInputComponent: IntervalInputComponent;

    @Input() displayValue?: ReadIntervalValue;

    customValidators = [];

    matcher = new ValueErrorStateMatcher();

    constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
        super();
    }

    standardValueComparisonFunc(
        initValue: Interval,
        curValue: Interval | null
    ): boolean {
        return (
            curValue instanceof Interval &&
            initValue.start === curValue.start &&
            initValue.end === curValue.end
        );
    }

    getInitValue(): Interval | null {
        if (this.displayValue !== undefined) {
            return new Interval(this.displayValue.start, this.displayValue.end);
        } else {
            return null;
        }
    }

    ngOnInit() {
        super.ngOnInit();
    }

    ngOnChanges(): void {
        this.resetFormControl();
    }

    // unsubscribe when the object is destroyed to prevent memory leaks
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    getNewValue(): CreateIntervalValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newIntervalValue = new CreateIntervalValue();

        newIntervalValue.start = this.valueFormControl.value.start;
        newIntervalValue.end = this.valueFormControl.value.end;

        if (this.commentFormControl.value) {
            newIntervalValue.valueHasComment = this.commentFormControl.value;
        }

        return newIntervalValue;
    }

    getUpdatedValue(): UpdateIntervalValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedIntervalValue = new UpdateIntervalValue();

        updatedIntervalValue.id = this.displayValue.id;

        updatedIntervalValue.start = this.valueFormControl.value.start;
        updatedIntervalValue.end = this.valueFormControl.value.end;

        // add the submitted comment to updatedIntervalValue only if user has added a comment
        if (
            this.commentFormControl.value !== null &&
            this.commentFormControl.value !== ''
        ) {
            updatedIntervalValue.valueHasComment =
                this.commentFormControl.value;
        }

        return updatedIntervalValue;
    }
}
