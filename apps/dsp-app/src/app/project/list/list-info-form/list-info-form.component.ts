import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    CreateListRequest,
    KnoraApiConnection,
    List,
    ListInfoResponse,
    ListNodeInfo,
    ListResponse,
    ProjectResponse,
    StringLiteral,
    UpdateListInfoRequest,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';

@Component({
    selector: 'app-list-info-form',
    templateUrl: './list-info-form.component.html',
    styleUrls: ['./list-info-form.component.scss'],
})
export class ListInfoFormComponent implements OnInit {
    @Input() iri?: string;

    @Input() mode: 'create' | 'update';

    // project uuid
    @Input() projectUuid: string;

    @Input() projectIri: string;

    @Output() closeDialog: EventEmitter<List | ListNodeInfo> =
        new EventEmitter<List>();

    loading: boolean;

    list: ListNodeInfo;

    labels: StringLiteral[];
    comments: StringLiteral[];

    // possible errors for the label
    labelErrors = {
        label: {
            required: 'A label is required.',
        },
        comment: {
            required: 'A description is required.',
        },
    };

    saveButtonDisabled = true;

    labelInvalidMessage: string;
    commentInvalidMessage: string;

    isLabelTouched = false;
    isCommentTouched = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _route: ActivatedRoute,
        private _router: Router,
        private _projectService: ProjectService
    ) {
        // in case of creating new
        if (this._route.parent) {
            this.mode = 'create';
            // get the uuid of the current project
            this._route.parent.paramMap.subscribe((params: Params) => {
                this.projectUuid = params.get('uuid');

                this._dspApiConnection.admin.projectsEndpoint
                    .getProjectByIri(
                        this._projectService.uuidToIri(this.projectUuid)
                    )
                    .subscribe(
                        (response: ApiResponseData<ProjectResponse>) => {
                            this.projectIri = response.body.project.id;
                        },
                        (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                        }
                    );
            });
        }
        // in case of edit
        if (this._route.firstChild) {
            this.mode = 'update';
            // get the uuid of the current project
            this._route.firstChild.paramMap.subscribe((params: Params) => {
                this.projectUuid = params.get('uuid');

                this._dspApiConnection.admin.projectsEndpoint
                    .getProjectByIri(
                        this._projectService.uuidToIri(this.projectUuid)
                    )
                    .subscribe(
                        (response: ApiResponseData<ProjectResponse>) => {
                            this.projectIri = response.body.project.id;
                        },
                        (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                        }
                    );
            });
        }
    }

    ngOnInit() {
        this.loading = true;
        // get list info in case of edit mode
        if (this.mode === 'update') {
            // edit mode, get list
            this._dspApiConnection.admin.listsEndpoint
                .getListInfo(this.iri)
                .subscribe(
                    (response: ApiResponseData<ListInfoResponse>) => {
                        this.list = response.body.listinfo;
                        this.buildLists(response.body.listinfo);
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                    }
                );
        } else {
            // build the form
            this.buildLists();
        }
    }

    buildLists(list?: ListNodeInfo): void {
        this.loading = true;
        this.labels = [];
        this.comments = [];

        if (list && list.id) {
            this.labels = list.labels;
            this.comments = list.comments;
        }

        this.loading = false;
    }

    submitData(): void {
        this.loading = true;

        if (this.mode === 'update') {
            // edit mode: update list info
            const listInfoUpdateData: UpdateListInfoRequest =
                new UpdateListInfoRequest();
            listInfoUpdateData.projectIri = this.projectIri;
            listInfoUpdateData.listIri = this.iri;
            listInfoUpdateData.labels = this.labels;
            listInfoUpdateData.comments = this.comments;

            this._dspApiConnection.admin.listsEndpoint
                .updateListInfo(listInfoUpdateData)
                .subscribe(
                    (response: ApiResponseData<ListInfoResponse>) => {
                        this.loading = false;
                        this.closeDialog.emit(response.body.listinfo);
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                        this.loading = false;
                    }
                );
        } else {
            // new: create list
            const listInfoData: CreateListRequest = new CreateListRequest();
            listInfoData.projectIri = this.projectIri;
            listInfoData.labels = this.labels;
            listInfoData.comments = this.comments;

            this._dspApiConnection.admin.listsEndpoint
                .createList(listInfoData)
                .subscribe(
                    (response: ApiResponseData<ListResponse>) => {
                        this.loading = false;
                        // go to the new list page
                        const array = response.body.list.listinfo.id.split('/');
                        const name = array[array.length - 1];
                        this._router.navigate(['list', name], {
                            relativeTo: this._route.parent,
                        });
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                        this.loading = false;
                    }
                );
        }
    }

    /**
     * reset the form
     */
    resetLists(ev: Event, list?: ListNodeInfo) {
        ev.preventDefault();

        list = list ? list : new ListNodeInfo();

        this.buildLists(list);
    }

    handleData(data: StringLiteral[], type: string) {
        switch (type) {
            case 'labels':
                this.labels = data;
                this.labelInvalidMessage = data.length
                    ? null
                    : this.labelErrors.label.required;
                break;

            case 'comments':
                this.comments = data;
                this.commentInvalidMessage = data.length
                    ? null
                    : this.labelErrors.comment.required;
                break;
        }

        this.saveButtonDisabled = !this.labels.length || !this.comments.length;
    }
}
