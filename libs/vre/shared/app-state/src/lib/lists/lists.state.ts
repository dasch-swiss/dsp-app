import { Inject, Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ApiResponseData, ApiResponseError, DeleteListNodeResponse, DeleteListResponse, KnoraApiConnection, ListsResponse } from '@dasch-swiss/dsp-js';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { ListsStateModel } from './lists.state-model';
import { ClearListsAction, DeleteListNodeAction, LoadListsInProjectAction } from './lists.actions';
import { of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

const defaults: ListsStateModel = {
    isLoading: false,
    listsInProject: [],
};

@State<ListsStateModel>({
    defaults,
    name: 'lists',
})
@Injectable()
export class ListsState {
    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _dialog: MatDialog,
    ) {}

    @Action(LoadListsInProjectAction)
    loadListsInProject(
        ctx: StateContext<ListsStateModel>,
        { projectIri }: LoadListsInProjectAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._dspApiConnection.admin.listsEndpoint
            .getListsInProject(projectIri)
            .pipe(
                take(1),
                map((response: ApiResponseData<ListsResponse> | ApiResponseError) => { 
                    return response as ApiResponseData<ListsResponse>;
                }),
                tap({
                    next: (response: ApiResponseData<ListsResponse>) => {
                        ctx.setState({ ...ctx.getState(), isLoading: false, listsInProject: response.body.lists });
                    },
                    error: (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                    }
                })
            );
    }

    @Action(DeleteListNodeAction)
    deleteListNode(
        ctx: StateContext<ListsStateModel>,
        { listIri }: DeleteListNodeAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._dspApiConnection.admin.listsEndpoint
            .deleteListNode(listIri)
            .pipe(
                take(1),
                map((response: ApiResponseData<DeleteListNodeResponse | DeleteListResponse> | ApiResponseError) => { 
                    return response as ApiResponseData<DeleteListNodeResponse>;
                }),
                tap({
                    next: (response: ApiResponseData<DeleteListNodeResponse>) => {
                        ctx.patchState({ isLoading: false });
                    },
                    error: (error: ApiResponseError) => {
                        this.handleDeleteError(error);
                    }
                })
            );
    }

    @Action(ClearListsAction)
    clearCurrentProject(ctx: StateContext<ListsStateModel>) {
        return of(ctx.getState()).pipe(
            map(currentState => {
                ctx.patchState(defaults);
                return currentState;
            })
        );
    }

    private handleDeleteError(error: ApiResponseError): void {
        // if DSP-API returns a 400, it is likely that the list node is in use so we inform the user of this
        if (error.status === 400) {
            const errorDialogConfig: MatDialogConfig =
                {
                    width: '640px',
                    position: {
                        top: '112px',
                    },
                    data: {
                        mode: 'deleteListNodeError',
                    },
                };

            //TODO decouple error handling 
            //this._dialog.open(DialogComponent, errorDialogConfig);
        } else {
            // use default error behavior
            this._errorHandler.showMessage(error);
        }
    }
}
