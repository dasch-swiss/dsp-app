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

export class SetCurrentResourceAction {
  static readonly type = '[Resource] Set Current Resource';

  constructor(public resource: DspResource) {}
}
