import { ReadGroup, ReadProject } from "@dasch-swiss/dsp-js";

export class SetCurrentProjectGroupsAction {
    static readonly type = '[CurrentProject] Set Current Project Groups';
    constructor(public groups: ReadGroup[]) {}
}

export class SetCurrentProjectAction {
    static readonly type = '[CurrentProject] Set Current Project';
    constructor(
        public readProject: ReadProject, 
        public isProjectAdmin: boolean = false, 
        public isProjectMember: boolean = false
    ) {}
}

export class ClearCurrentProjectAction {
    static readonly type = '[CurrentProject] Clear Current Project';
}

export class SetCurrentProjectByUuidAction {
    static readonly type = '[CurrentProject] Set Current Project By Uuid';
    constructor(public projectUuid: string) {}
}