import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
    CreateLinkValue,
    KnoraApiConnection,
    ReadLinkValue,
    ReadResource,
    ReadResourceSequence,
    ResourceClassAndPropertyDefinitions,
    UpdateLinkValue
} from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

export function resourceValidator(control: AbstractControl) {
    const invalid = !(control.value === null || control.value === '' || control.value instanceof ReadResource);
    return invalid ? { invalidType: { value: control.value } } : null;
}

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-link-value',
    templateUrl: './link-value.component.html',
    styleUrls: ['./link-value.component.scss']
})

export class LinkValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
    @Input() displayValue?: ReadLinkValue;
    @Input() parentResource: ReadResource;
    @Input() propIri: string;

    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> = new EventEmitter();

    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> = new EventEmitter();

    resources: ReadResource[] = [];
    restrictToResourceClass: string;
    valueFormControl: FormControl;
    commentFormControl: FormControl;
    form: FormGroup;
    resourceClassLabel: string;

    valueChangesSubscription: Subscription;
    labelChangesSubscription: Subscription;
    // label cannot contain logical operations of lucene index
    customValidators = [resourceValidator];

    constructor(
        private _dialog: MatDialog,
        @Inject(FormBuilder) private _fb: FormBuilder,
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection) {
        super();
    }

    /**
     * displays a selected resource using its label.
     *
     * @param resource the resource to be displayed (or no selection yet).
     */
    displayResource(resource: ReadResource | null): string {
        // null is the initial value (no selection yet)
        if (resource instanceof ReadResource) {
            return resource.label;
        }
    }

    /**
     * search for resources whose labels contain the given search term, restricting to to the given properties object constraint.
     * this is to be used for update and new linked resources
     *
     * @param searchTerm label to be searched
     */
    searchByLabel(searchTerm: string) {
        // at least 3 characters are required
        if (typeof searchTerm === 'string' && searchTerm.length >= 3) {
            this._dspApiConnection.v2.search.doSearchByLabel(
                searchTerm, 0, { limitToResourceClass: this.restrictToResourceClass }).subscribe(
                (response: ReadResourceSequence) => {
                    this.resources = response.resources;
                });
        } else {
            this.resources = [];
        }
    }

    // show the label of the linked resource
    getInitValue(): ReadResource | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.linkedResource;
        } else {
            return null;
        }
    }

    standardValueComparisonFunc(initValue: ReadResource, curValue: ReadResource | string | null): boolean {
        return (curValue instanceof ReadResource) && initValue.id === curValue.id;
    }

    ngOnInit() {
        const linkType = this.parentResource.getLinkPropertyIriFromLinkValuePropertyIri(this.propIri);
        this.restrictToResourceClass = this.parentResource.entityInfo.properties[linkType].objectType;

        // get label of resource class
        this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(this.restrictToResourceClass).subscribe(
            (onto: ResourceClassAndPropertyDefinitions) => this.resourceClassLabel = onto.classes[this.restrictToResourceClass].label
        );

        // initialize form control elements
        this.valueFormControl = new FormControl(null);

        this.commentFormControl = new FormControl(null);

        // subscribe to any change on the comment and recheck validity
        this.valueChangesSubscription = this.commentFormControl.valueChanges.subscribe(
            data => {
                this.valueFormControl.updateValueAndValidity();
            }
        );

        this.labelChangesSubscription = this.valueFormControl.valueChanges.subscribe(data => {
            this.searchByLabel(data);
        });

        this.form = this._fb.group({
            value: this.valueFormControl,
            comment: this.commentFormControl
        });

        this.resetFormControl();

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.addToParentFormGroup(this.formName, this.form);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.resetFormControl();
    }

    // unsubscribe when the object is destroyed to prevent memory leaks
    ngOnDestroy(): void {
        this.unsubscribeFromValueChanges();

        if (this.labelChangesSubscription !== undefined) {
            this.labelChangesSubscription.unsubscribe();
        }

        resolvedPromise.then(() => {
            // remove form from the parent form group
            this.removeFromParentFormGroup(this.formName);
        });
    }

    getNewValue(): CreateLinkValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }
        const newLinkValue = new CreateLinkValue();
        newLinkValue.linkedResourceIri = this.valueFormControl.value.id;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newLinkValue.valueHasComment = this.commentFormControl.value;
        }

        return newLinkValue;
    }

    getUpdatedValue(): UpdateLinkValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedLinkValue = new UpdateLinkValue();

        updatedLinkValue.id = this.displayValue.id;

        updatedLinkValue.linkedResourceIri = this.valueFormControl.value.id;

        // add the submitted comment to updatedLinkValue only if user has added a comment
        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedLinkValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedLinkValue;
    }

    /**
     * emits the displayValue on click.
     */
    refResClicked() {
        this.referredResourceClicked.emit(this.displayValue);
    }

    /**
     * emits the displayValue on hover.
     */
    refResHovered() {
        this.referredResourceHovered.emit(this.displayValue);
    }

    openDialog(mode: string, ev: Event, iri?: string): void {
        ev.preventDefault();
        const dialogConfig: MatDialogConfig = {
            width: '840px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: this.resourceClassLabel, id: iri, parentResource: this.parentResource, resourceClassDefinition: this.restrictToResourceClass },
            disableClose: true
        };

        this._dialog.open(DialogComponent, dialogConfig);
    }
}
