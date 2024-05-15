import { DspResource } from '@dasch-swiss/vre/shared/app-common';

export class GetAttachedUserAction {
  static readonly type = '[Resource] Get Attached User';

  constructor(
    public resourceIri: string,
    public identifier: string,
    public idType: 'iri' | 'username' | 'email' = 'iri'
  ) {}
}

export class GetAttachedProjectAction {
  static readonly type = '[Resource] Get Attached Project';

  constructor(
    public resourceIri: string,
    public projectIri: string
  ) {}
}

export class ToggleShowAllPropsAction {
  static readonly type = '[Resource] Toggle Show All Properties';
}

export class ToggleShowAllCommentsAction {
  static readonly type = '[Resource] Toggle Show All Comments';
}

export class LoadResourceAction {
  static readonly type = '[Resource] Load resource';

  constructor(public resourceIri: string) {}
}

export class LoadAnnotatedResourceAction {
  static readonly type = '[Resource] Load annotated resource';

  constructor(public regionIri: string) {}
}
