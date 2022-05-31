import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import {
    ApiResponseError,
    CreateListValue,
    KnoraApiConnection,
    ListNodeV2,
    ReadListValue,
    ResourcePropertyDefinition,
    UpdateListValue
} from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { NotificationService } from 'src/app/main/services/notification.service';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-list-value',
    templateUrl: './list-value.component.html',
    styleUrls: ['./list-value.component.scss']
})
export class ListValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @Input() displayValue?: ReadListValue;
    @Input() propertyDef: ResourcePropertyDefinition;
    @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

    valueFormControl: FormControl;
    commentFormControl: FormControl;
    listRootNode: ListNodeV2;
    // active node
    selectedNode: ListNodeV2;

    form: FormGroup;

    valueChangesSubscription: Subscription;

    customValidators = [];

    constructor(
        @Inject(FormBuilder) private _fb: FormBuilder,
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService
    ) {
        super();
    }

    getInitValue(): string | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.listNode;
        } else {
            return null;
        }
    }
    // override the resetFormControl() from the base component to deal with appending root nodes.
    resetFormControl(): void {
        super.resetFormControl();
        if (this.mode === 'update') {
            this.selectedNode = new ListNodeV2();
            this.selectedNode.label = this.displayValue.listNodeLabel;
        } else {
            this.selectedNode = null;
        }
        if (this.valueFormControl !== undefined) {
            if (this.mode !== 'read') {
                const rootNodeIris = this.propertyDef.guiAttributes;
                for (const rootNodeIri of rootNodeIris) {
                    const trimmedRootNodeIRI = rootNodeIri.substr(7, rootNodeIri.length - (1 + 7));
                    this._dspApiConnection.v2.list.getList(trimmedRootNodeIRI).subscribe(
                        (response: ListNodeV2) => {
                            this.listRootNode = response;
                        }, (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                        });
                }
            } else {
                this.valueFormControl.setValue(this.displayValue.listNodeLabel);
            }
        }
    }

    ngOnInit() {

        this.valueFormControl = new FormControl(null);
        this.commentFormControl = new FormControl(null);
        this.valueChangesSubscription = this.commentFormControl.valueChanges.subscribe(
            data => {
                this.valueFormControl.updateValueAndValidity();
            }
        );
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

    ngOnDestroy(): void {
        this.unsubscribeFromValueChanges();

        resolvedPromise.then(() => {
            // remove form from the parent form group
            this.removeFromParentFormGroup(this.formName);
        });
    }

    getNewValue(): CreateListValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newListValue = new CreateListValue();
        newListValue.listNode = this.valueFormControl.value;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newListValue.valueHasComment = this.commentFormControl.value;
        }

        return newListValue;
    }

    getUpdatedValue(): UpdateListValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedListValue = new UpdateListValue();

        updatedListValue.id = this.displayValue.id;
        if (this.selectedNode) {
            updatedListValue.listNode = this.selectedNode.id;
        } else {
            updatedListValue.listNode = this.displayValue.listNode;
        }
        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedListValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedListValue;
    }

    getSelectedNode(item: ListNodeV2) {
        this.menuTrigger.closeMenu();
        this.valueFormControl.markAsDirty();
        this.selectedNode = item;
        this.valueFormControl.setValue(item.id);
    }

}
