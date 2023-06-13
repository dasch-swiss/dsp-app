import {
    Component,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import {
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ListNodeV2,
    ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { IRI, PropertyValue, Value } from '../operator';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-list-value',
    templateUrl: './search-list-value.component.html',
    styleUrls: ['./search-list-value.component.scss'],
})
export class SearchListValueComponent
    implements OnInit, OnDestroy, PropertyValue
{
    @Input() property: ResourcePropertyDefinition;
    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

    type = Constants.ListValue;

    form: UntypedFormGroup;

    listRootNode: ListNodeV2;

    selectedNode: ListNodeV2;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        @Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder,
        private _errorHandler: ErrorHandlerService
    ) {}

    ngOnInit() {
        this.form = this._fb.group({
            listValue: [null, Validators.required],
        });

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('propValue', this.form);
        });

        const rootNodeIri = this._getRootNodeIri();

        this._dspApiConnection.v2.list.getList(rootNodeIri).subscribe(
            (response: ListNodeV2) => {
                this.listRootNode = response;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    ngOnDestroy() {
        // remove form from the parent form group
        resolvedPromise.then(() => {
            this.formGroup.removeControl('propValue');
        });
    }

    getValue(): Value {
        return new IRI(this.form.value.listValue);
    }

    getSelectedNode(item: ListNodeV2) {
        this.menuTrigger.closeMenu();
        this.selectedNode = item;

        this.form.controls['listValue'].setValue(item.id);
    }

    private _getRootNodeIri(): string {
        const guiAttr = this.property.guiAttributes;

        if (guiAttr.length === 1 && guiAttr[0].startsWith('hlist=')) {
            const listNodeIri = guiAttr[0].substring(7, guiAttr[0].length - 1); // hlist=<>, get also rid of <>
            return listNodeIri;
        } else {
            console.error('No root node Iri given for property', guiAttr);
        }
    }
}
