import {
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    ViewChild,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { Constants, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import {
    ComparisonOperator,
    ComparisonOperatorAndValue,
    Equals,
    Exists,
    NotExists,
    GreaterThan,
    GreaterThanEquals,
    LessThan,
    LessThanEquals,
    Like,
    Match,
    NotEquals,
    PropertyValue,
    Value,
} from './operator';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-specify-property-value',
    templateUrl: './specify-property-value.component.html',
    styleUrls: ['./specify-property-value.component.scss'],
})
export class SpecifyPropertyValueComponent implements OnChanges, OnDestroy {
    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    @Input() topLevel: boolean;

    @ViewChild('propertyValue', { static: false })
    propertyValueComponent: PropertyValue;

    // available comparison operators for the property
    comparisonOperators: Array<ComparisonOperator> = [];

    // comparison operator selected by the user
    comparisonOperatorSelected: ComparisonOperator;

    // the type of the property
    propertyValueType;

    comparisonOperatorChangesSubscription: Subscription;

    Constants = Constants;

    objectClassConstraint: string;

    form: UntypedFormGroup;

    private _property: ResourcePropertyDefinition;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    // getter method for this._property
    get property(): ResourcePropertyDefinition {
        return this._property;
    }

    // setter method for the property chosen by the user
    @Input()
    set property(prop: ResourcePropertyDefinition) {
        this._property = prop;
    }

    ngOnChanges(): void {
        // build a form for comparison operator selection
        this.form = this._fb.group({
            comparisonOperator: [null, Validators.required],
        });

        this._closeComparisonOperatorChangesSubscription();

        // store comparison operator when selected
        this.comparisonOperatorChangesSubscription =
            this.form.valueChanges.subscribe((data) => {
                this.comparisonOperatorSelected = data.comparisonOperator;
            });

        // comparison operator selection
        this.comparisonOperatorSelected = undefined; // reset to initial state
        this.resetComparisonOperators(); // reset comparison operators for given property (overwriting any previous selection)

        // use knora-api:Resource as a fallback
        this.objectClassConstraint =
            this.property.isLinkProperty &&
            this.property.objectType !== undefined
                ? this.property.objectType
                : Constants.Resource;

        resolvedPromise.then(() => {
            // remove from the parent form group (clean reset)
            this.formGroup.removeControl('comparisonOperator');

            // add form to the parent form group
            this.formGroup.addControl('comparisonOperator', this.form);
        });

        this.form.controls.comparisonOperator.setValue(
            this.comparisonOperators[0]
        );
    }

    ngOnDestroy() {
        this._closeComparisonOperatorChangesSubscription();
    }

    /**
     * resets the comparison operators for this._property.
     */
    resetComparisonOperators() {
        // depending on object class, set comparison operators and value entry field
        if (this._property.isLinkProperty) {
            this.propertyValueType = Constants.Resource;
        } else {
            this.propertyValueType = this._property.objectType;
        }

        switch (this.propertyValueType) {
            case Constants.TextValue:
                if (
                    this._property.guiElement ===
                    Constants.SalsahGui + Constants.HashDelimiter + 'Richtext'
                ) {
                    this.comparisonOperators = [
                        new Like(),
                        new Match(),
                        new Exists(),
                        new NotExists(),
                    ];
                } else {
                    this.comparisonOperators = [
                        new Like(),
                        new Match(),
                        new Equals(),
                        new NotEquals(),
                        new Exists(),
                        new NotExists(),
                    ];
                }
                break;

            case Constants.BooleanValue:
                this.comparisonOperators = [
                    new Equals(),
                    new Exists(),
                    new NotExists(),
                ];
                break;

            case Constants.UriValue:
                this.comparisonOperators = [
                    new Equals(),
                    new NotEquals(),
                    new Exists(),
                    new NotExists(),
                ];
                break;

            case Constants.Resource: // tODO: Match is only available on top level
                this.comparisonOperators = this.topLevel
                    ? [
                        new Equals(),
                        new NotEquals(),
                        new Exists(),
                        new NotExists(),
                        new Match(),
                    ]
                    : [
                        new Equals(),
                        new NotEquals(),
                        new Exists(),
                        new NotExists(),
                    ];
                break;

            case Constants.IntValue:
            case Constants.DecimalValue:
            case Constants.DateValue:
                this.comparisonOperators = [
                    new Equals(),
                    new NotEquals(),
                    new LessThan(),
                    new LessThanEquals(),
                    new GreaterThan(),
                    new GreaterThanEquals(),
                    new Exists(),
                    new NotExists(),
                ];
                break;

            case Constants.ListValue:
                this.comparisonOperators = [
                    new Equals(),
                    new NotEquals(),
                    new Exists(),
                    new NotExists(),
                ];
                break;

            case Constants.GeomValue:
            case Constants.FileValue:
            case Constants.AudioFileValue:
            case Constants.StillImageFileValue:
            case Constants.DDDFileValue:
            case Constants.MovingImageFileValue:
            case Constants.TextFileValue:
            case Constants.ColorValue:
            case Constants.IntervalValue:
            case Constants.GeonameValue:
            case Constants.TimeValue:
                this.comparisonOperators = [
                    new Exists(),
                    new NotExists(),
                ];
                break;

            default:
                console.error(
                    'Advanced search: Unsupported value type ' +
                        this._property.objectType
                );
        }
    }

    /**
     * gets the specified comparison operator and value for the property.
     *
     * returns {ComparisonOperatorAndValue} the comparison operator and the specified value
     */
    getComparisonOperatorAndValueLiteralForProperty(): ComparisonOperatorAndValue {
        // return value (literal or IRI) from the child component
        let value: Value;

        // comparison operator 'Exists' does not require a value
        if (this.comparisonOperatorSelected.getClassName() !== 'Exists' &&
            this.comparisonOperatorSelected.getClassName() !== 'NotExists') {
            value = this.propertyValueComponent.getValue();
        }

        // return the comparison operator and the specified value
        return new ComparisonOperatorAndValue(
            this.comparisonOperatorSelected,
            value
        );
    }

    /**
     * unsubscribe from form changes.
     */
    private _closeComparisonOperatorChangesSubscription() {
        if (this.comparisonOperatorChangesSubscription !== undefined) {
            this.comparisonOperatorChangesSubscription.unsubscribe();
        }
    }
}
