import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiServiceError, List, ListCreatePayload, ListInfo, ListInfoUpdatePayload, ListsService, Project, StringLiteral } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';

@Component({
    selector: 'app-list-info-form',
    templateUrl: './list-info-form.component.html',
    styleUrls: ['./list-info-form.component.scss']
})
export class ListInfoFormComponent implements OnInit {

    loading: boolean;

    @Input() iri?: string;

    // project short code
    @Input() projectcode: string;

    @Input() projectIri: string;

    @Output() closeDialog: EventEmitter<List | ListInfo> = new EventEmitter<List>();

    @Output() updateParent: EventEmitter<string> = new EventEmitter<string>();

    project: Project;

    list: ListInfo;

    labels: StringLiteral[];
    comments: StringLiteral[];

    /**
     * by adding new list, it starts with the list info and the next section is "creating the list";
     * true after adding list
     *
     */
    createList: boolean = false;
    newList: List;

    nameMinLength = 3;
    nameMaxLength = 16;

    /**
     * form group for the form controller
     */
    form: FormGroup;

    /**
     * error checking on the following fields
     */
    formErrors = {
        label: ''
    };

    /**
     * error hints
     */
    validationMessages = {
        label: {
            'required': 'Name is required.',
            'minlength': 'Name must be at least ' + this.nameMinLength + ' characters long.',
            'maxlength': 'Name cannot be more than ' + this.nameMaxLength + ' characters long.'
        }
    };


    /**
     * in case of an API error
     */
    errorMessage: any;

    /**
     * success of sending data
     */
    success = false;
    /**
     * message after successful post
     */
    successMessage: any = {
        status: 200,
        statusText: "You have successfully updated list's info."
    };

    /**
     * In this prototype we create list in only one language,
     * the user has to select the language to use
     */
    languagesList: StringLiteral[] = AppGlobal.languagesList;

    constructor (
        private _listsService: ListsService) {
    }

    ngOnInit() {

        this.loading = true;

        // get list info in case of edit mode: this.iri is not undefined
        if (this.iri) {
            // edit mode, get list
            this._listsService.getListInfo(this.iri).subscribe(
                (response: ListInfo) => {
                    this.list = response;
                    this.buildForm(response);
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );

        } else {
            // build the form
            this.buildForm();
        }
    }

    buildForm(list?: ListInfo): void {

        this.loading = true;
        this.labels = [];
        this.comments = [];
        // let label: string = '';
        // let comment: string = '';

        // let language: string = this.languagesList[0].language;

        if (list && list.id) {
            this.labels = list.labels;
            this.comments = list.comments;
            //            label = list.labels[0].value;
            //            language = list.labels[0].language;
            // if (list.comments.length > 0) {
            //     comment = list.comments[0].value;
            // }
        }

        /*
        this.form = this._formBuilder.group({
            label: new FormControl(
                {
                    value: this.labels,
                    disabled: false
                },
                [Validators.required]
            ),
            comment: new FormControl(
                {
                    value: this.comments,
                    disabled: false
                }
            ),
            language: new FormControl(
                {
                    value: ,
                    disabled: false
                }
            )
        });
        */

        // this.form.valueChanges.subscribe(data => this.onValueChanged());
        setTimeout(() => {
            // console.log(this.resource);
            this.loading = false;
        });
    }

    /*
    onValueChanged() {
        if (!this.form) {
            return;
        }

        const form = this.form;

        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = form.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.formErrors[field] += messages[key] + ' ';
                });
            }
        });
    }
    */

    submitData(): void {
        this.loading = true;

        if (this.iri) {
            // edit mode: update list info
            const listInfoUpdateData: ListInfoUpdatePayload = {
                projectIri: this.projectIri,
                listIri: this.iri,
                labels: this.labels,
                comments: this.comments
            };
            this._listsService.updateListInfo(listInfoUpdateData).subscribe(
                (result: ListInfo) => {
                    this.success = true;
                    this.loading = false;
                    this.closeDialog.emit(result);
                },
                (error: ApiServiceError) => {
                    this.errorMessage = error;
                    this.loading = false;
                    this.success = false;
                    // console.error(error);
                }
            );

        } else {
            // new: create list
            const listInfoData: ListCreatePayload = {
                projectIri: this.projectIri,
                labels: this.labels,
                comments: this.comments
            };
            this._listsService.createList(listInfoData).subscribe(
                (result: List) => {
                    // console.log(result);
                    // this.closeDialog.emit(result);
                    this.newList = result;
                    console.log(this.newList)
                    this.updateParent.emit(result.listinfo.labels[0].value + ' (' + result.listinfo.labels[0].language + ')');
                    this.loading = false;
                    // setTimeout(() => {
                    //     // console.log(this.resource);
                    //     this.initContent();
                    // });
                    this.createList = true;
                },
                (error: ApiServiceError) => {
                    this.errorMessage = error;
                    this.loading = false;
                    this.success = false;
                }
            );
        }
    }

    updateListInfo() {

    }

    /**
     * Reset the form
     */
    resetForm(ev: Event, list?: ListInfo) {

        ev.preventDefault();

        list = list ? list : new ListInfo();

        this.buildForm(list);



    }

    handleData(data: StringLiteral[], type: string) {

        switch (type) {
            case 'labels':
                this.labels = data;
                // if (data.length === 0) {
                //     this.formErrors.label = this.validationMessages.label.required;
                // } else {
                //     this.formErrors.label = '';
                // }
                break;

            case 'comments':
                this.comments = data;
                break;
        }
    }

    closeMessage() {
        this.closeDialog.emit(this.list);
    }

}
