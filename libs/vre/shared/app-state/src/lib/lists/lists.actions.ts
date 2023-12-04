
export class ClearListsAction {
    static readonly type = '[Lists] Clear lists';
}

export class LoadListsInProjectAction {
    static readonly type = '[Lists] Load Lists In Project';
    constructor(public projectIri: string) {}
}

export class DeleteListNodeAction {
    static readonly type = '[Lists] Delete List Node';
    constructor(public listIri: string) {}
}