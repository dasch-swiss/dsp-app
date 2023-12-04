import { ClearProjectOntologiesAction } from './../ontologies/ontologies.actions';
import { Injectable } from '@angular/core';
import { Action, State, StateContext, Store } from '@ngxs/store';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { map } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { CurrentProjectStateModel } from './current-project.state-model';
import { ClearCurrentProjectAction as ClearCurrentProjectAction, SetCurrentProjectAction, SetCurrentProjectByUuidAction, SetCurrentProjectGroupsAction } from './current-project.actions';
import { ProjectsSelectors } from '../projects/projects.selectors';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { UserSelectors } from '../user/user.selectors';

const defaults: CurrentProjectStateModel = {
    isLoading: false,
    hasLoadingErrors: false,
    project: undefined,
    groups: [],
    isProjectAdmin: false,
    isProjectMember: false,
};

@State<CurrentProjectStateModel>({
    defaults,
    name: 'currentProject',
})
@Injectable()
export class CurrentProjectState {
    constructor(
        private _store: Store,
        public _projectService: ProjectService,
    ) {}
    
    @Action(SetCurrentProjectGroupsAction)
    setProjectGroupsAction(
        ctx: StateContext<CurrentProjectStateModel>,
        { groups }: SetCurrentProjectGroupsAction
    ) {
        if (!groups || groups.length === 0) {
            return EMPTY;
        }

        return ctx.setState({ ...ctx.getState(), groups });
    }
    
    @Action(SetCurrentProjectAction, { cancelUncompleted: true })
    setCurrentProjectAction(
        ctx: StateContext<CurrentProjectStateModel>,
        { 
            readProject,
            isProjectAdmin,
            isProjectMember
         }: SetCurrentProjectAction
    ) {
        return ctx.setState({ ...defaults, project: readProject, isProjectAdmin, isProjectMember });
    }

    @Action(SetCurrentProjectByUuidAction, { cancelUncompleted: true })
    setCurrentProjectByUuidAction(
        ctx: StateContext<CurrentProjectStateModel>,
        { projectUuid }: SetCurrentProjectByUuidAction
    ) {
        const projects = this._store.selectSnapshot(ProjectsSelectors.readProjects);
        const currentProject = projects.find(project => project.id === this._projectService.uuidToIri(projectUuid));
        const user = this._store.selectSnapshot(UserSelectors.user) as ReadUser;
        let isProjectAdmin = false;
        let isProjectMember = false;
        if (user) {
            const userProjectGroups = this._store.selectSnapshot(UserSelectors.userProjectAdminGroups);
            isProjectAdmin = this._projectService.isProjectAdminOrSysAdmin(user, userProjectGroups, projectUuid);
            isProjectMember = this._projectService.isProjectMember(user, userProjectGroups, projectUuid);
        }
        
        if (currentProject) {
            return ctx.setState({ ...defaults, project: currentProject, isProjectAdmin, isProjectMember });
        }
        
        return;
    }
    
    @Action(ClearCurrentProjectAction)
    clearCurrentProject(ctx: StateContext<CurrentProjectStateModel>) {
        return of(ctx.getState()).pipe(
            map(currentState => {
                const projectUuid = ctx.getState().project?.id;
                if (projectUuid) {
                    ctx.dispatch(new ClearProjectOntologiesAction(projectUuid))
                }
                
                ctx.patchState(defaults);
                return currentState;
            })
        );
    }
}
