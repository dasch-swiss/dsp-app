import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl } from '@angular/forms';
import { CreateGeonameValue, ReadGeonameValue, UpdateGeonameValue } from '@dasch-swiss/dsp-js';
import { Observable, Subscription } from 'rxjs';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';
import { DisplayPlace, GeonameService, SearchPlace } from '../../services/geoname.service';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

export function geonameIdValidator(control: AbstractControl) {
    // null or empty checks are out of this validator's scope
    // check for a valid geoname id object
    const invalid = !(control.value === null || control.value === '' || (typeof control.value === 'object' && 'id' in control.value));
    return invalid ? { invalidType: { value: control.value } } : null;
}

@Component({
    selector: 'app-geoname-value',
    templateUrl: './geoname-value.component.html',
    styleUrls: ['./geoname-value.component.scss']
})
export class GeonameValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
    @Input() displayValue?: ReadGeonameValue;

    valueChangesSubscription: Subscription;

    matcher = new ValueErrorStateMatcher();
    customValidators = [geonameIdValidator];

    $geonameLabel: Observable<DisplayPlace>;

    places: SearchPlace[];

    constructor(@Inject(FormBuilder) protected _fb: FormBuilder, private _geonameService: GeonameService) {
        super();
    }

    standardValueComparisonFunc(initValue: { id: string }, curValue: { id: string } | null): boolean {
        return (curValue !== null && typeof curValue === 'object' && 'id' in curValue) && initValue.id === curValue.id;
    }

    getInitValue(): { id: string }  | null {

        if (this.displayValue !== undefined) {
            return {
                id: this.displayValue.geoname
            }; // todo: try to set a display name to be shown when value is updated
        } else {
            return null;
        }
    }

    /**
     * used to create a value which is displayed to the user after selection from autocomplete.
     *
     * @param place the user selected place.
     */
    displayPlaceInSearch(place: SearchPlace | null) {
        if (place !== null) {
            return place.displayName;
        }
    }

    ngOnInit() {

        // initialize component separately hence there is additional logic and different order which is not covered by super.ngOnInit
        this.valueFormControl = new FormControl(null);

        this.commentFormControl = new FormControl(null);

        this.form = this._fb.group({
            value: this.valueFormControl,
            comment: this.commentFormControl
        });

        // react to user typing places
        this.valueChangesSubscription = this.valueFormControl.valueChanges.subscribe(
            (searchTerm: string) => {

                // console.log(searchTerm);
                // tODO: move this to a method
                if ((this.mode === 'create' || this.mode === 'update') && searchTerm !== null) {
                    if (typeof searchTerm === 'string' && searchTerm.length >= 3) {
                        // console.log('searching for ' + searchTerm);
                        this._geonameService.searchPlace(searchTerm).subscribe(
                            places => this.places = places,
                            err => this.places = []
                        );
                    } else {
                        this.places = [];
                    }
                }
            }
        );

        this.commentChangesSubscription = this.commentFormControl.valueChanges.subscribe(
            data => {
                this.valueFormControl.updateValueAndValidity();
            }
        );

        this.resetFormControl();

        if (this.mode === 'read') {
            this.$geonameLabel = this._geonameService.resolveGeonameID(this.valueFormControl.value.id);
        }

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.addToParentFormGroup(this.formName, this.form);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {

        // resets values and validators in form controls when input displayValue or mode changes
        // at the first call of ngOnChanges, form control elements are not initialized yet
        this.resetFormControl();

        if (this.mode === 'read' && this.valueFormControl !== undefined) {
            this.$geonameLabel = this._geonameService.resolveGeonameID(this.valueFormControl.value.id);
        }
    }

    ngOnDestroy(): void {
        this.valueChangesSubscription.unsubscribe();
        this.commentChangesSubscription.unsubscribe();
        resolvedPromise.then(() => {
            // remove form from the parent form group
            this.removeFromParentFormGroup(this.formName);
        });
    }

    getNewValue(): CreateGeonameValue | false {

        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newGeonameValue = new CreateGeonameValue();

        newGeonameValue.geoname = this.valueFormControl.value.id;

        if (this.commentFormControl.value) {
            newGeonameValue.valueHasComment = this.commentFormControl.value;
        }

        return newGeonameValue;

    }

    getUpdatedValue(): UpdateGeonameValue | false {

        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedGeonameValue = new UpdateGeonameValue();

        updatedGeonameValue.id = this.displayValue.id;

        updatedGeonameValue.geoname = this.valueFormControl.value.id;

        if (this.commentFormControl.value) {
            updatedGeonameValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedGeonameValue;
    }

}
