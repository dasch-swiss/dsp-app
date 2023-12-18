import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { ApiResponseError } from '@dasch-swiss/dsp-js';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { ListsStateModel } from './lists.state-model';
import {
    ClearListsAction,
    DeleteListNodeAction,
    LoadListsInProjectAction,
} from './lists.actions';
import { of } from 'rxjs';
import { finalize, map, take, tap } from 'rxjs/operators';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';

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
        private _listApiService: ListApiService,
        private _errorHandler: AppErrorHandler
    ) {}

    @Action(LoadListsInProjectAction)
    loadListsInProject(
        ctx: StateContext<ListsStateModel>,
        { projectIri }: LoadListsInProjectAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._listApiService.listInProject(projectIri).pipe(
            take(1),
            tap((response) =>
                ctx.patchState({ listsInProject: response.lists })
            ),
            finalize(() => ctx.patchState({ isLoading: false }))
        );
    }

    @Action(DeleteListNodeAction)
    deleteListNode(
        ctx: StateContext<ListsStateModel>,
        { listIri }: DeleteListNodeAction
    ) {
        ctx.patchState({ isLoading: true });
        return this._listApiService.deleteListNode(listIri).pipe(
            take(1),
            tap({
                next: () => {
                    ctx.patchState({ isLoading: false });
                },
                error: (error: ApiResponseError) => {
                    this.handleDeleteError(error);
                },
            })
        );
    }

    @Action(ClearListsAction)
    clearCurrentProject(ctx: StateContext<ListsStateModel>) {
        return of(ctx.getState()).pipe(
            map((currentState) => {
                ctx.patchState(defaults);
                return currentState;
            })
        );
    }

    private handleDeleteError(error: ApiResponseError): void {
        // if DSP-API returns a 400, it is likely that the list node is in use so we inform the user of this
        if (error.status !== 400) {
            this._errorHandler.showMessage(error);
        }
    }
}
