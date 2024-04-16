import { ReadUser, UpdateUserRequest, User } from '@dasch-swiss/dsp-js';

export class LoadUserAction {
  static readonly type = '[User] Load User';

  constructor(
    public identifier: string,
    public idType: 'iri' | 'username' | 'email' = 'username'
  ) {}
}

export class LoadUserContentByIriAction {
  static readonly type = '[User] Load User Content By Iri';

  constructor(public iri: string) {}
}

export class SetUserAction {
  static readonly type = '[User] Set User';

  constructor(public user: ReadUser) {}
}

export class RemoveUserAction {
  static readonly type = '[User] Remove User';

  constructor(public user: ReadUser) {}
}

export class LogUserOutAction {
  static readonly type = '[User] Log user out';
}

export class SetUserProjectGroupsAction {
  static readonly type = '[User] Set User Project Groups';

  constructor(public user: ReadUser) {}
}

export class LoadUsersAction {
  static readonly type = '[User] Load All Users';

  constructor(public loadFullUserData = false) {}
}

export class ResetUsersAction {
  static readonly type = '[User] Reset All Users';
}

export class CreateUserAction {
  static readonly type = '[User] Create User';

  constructor(
    public userData: User,
    public enrollToProject: string = ''
  ) {}
}

export class UpdateUserAction {
  static readonly type = '[User] Update User';

  constructor(
    public id: string,
    public userData: UpdateUserRequest
  ) {}
}
