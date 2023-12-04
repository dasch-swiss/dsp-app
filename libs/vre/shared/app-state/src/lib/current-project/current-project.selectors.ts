import { CurrentProjectState } from './current-project.state';
import { Selector } from '@ngxs/store';
import { CurrentProjectStateModel } from './current-project.state-model';
import { ReadGroup, ReadProject, ReadUser } from '@dasch-swiss/dsp-js';

export class CurrentProjectSelectors {
    @Selector([CurrentProjectState])
    static isProjectsLoading(state: CurrentProjectStateModel): boolean {
        return state.isLoading;
    }

    @Selector([CurrentProjectState])
    static hasLoadingErrors(state: CurrentProjectStateModel): boolean {
        return state.hasLoadingErrors;
    }

    @Selector([CurrentProjectState])
    static isProjectMember(state: CurrentProjectStateModel): boolean {
        return state.isProjectMember;
    }

    @Selector([CurrentProjectState])
    static isProjectAdmin(state: CurrentProjectStateModel): boolean {
        return state.isProjectAdmin;
    }

    @Selector([CurrentProjectState])
    static projectGroups(state: CurrentProjectStateModel): ReadGroup[] {
        return state.groups;
    }

    @Selector([CurrentProjectState])
    static project(state: CurrentProjectStateModel): ReadProject | undefined {
        return state.project;
    }
}
