import { ReadUser, UpdateProjectRequest } from '@dasch-swiss/dsp-js';

export class LoadProjectsAction {
  static readonly type = '[Projects] Load Projects';
}

export class LoadProjectAction {
  static readonly type = '[Projects] Load Project';
  constructor(
    public projectUuid: string,
    public loadMembership = true
  ) {}
}

export class LoadProjectMembershipAction {
  static readonly type = '[Projects] Load Project Membership';
  constructor(public projectUuid: string) {}
}

export class ClearProjectsAction {
  static readonly type = '[Projects] Clear projects';
}
export class ClearProjectsMembershipAction {
  static readonly type = '[Projects] Clear projects membership';
}

export class RemoveUserFromProjectAction {
  static readonly type = '[Projects] Remove User From Project';
  constructor(
    public userId: string,
    public projectIri: string
  ) {}
}

export class AddUserToProjectMembershipAction {
  static readonly type = '[Projects] Add User To Project Membership';
  constructor(
    public userId: string,
    public projectIri: string
  ) {}
}

export class LoadProjectMembersAction {
  static readonly type = '[Projects] Load Project Members';
  constructor(public projectUuid: string) {}
}

export class LoadProjectGroupsAction {
  static readonly type = '[Projects] Load Project Groups';
  constructor(public projectUuid: string) {}
}

export class UpdateProjectAction {
  static readonly type = '[Projects] Update Project';
  constructor(
    public projectUuid: string,
    public projectData: UpdateProjectRequest
  ) {}
}

export class SetProjectMemberAction {
  static readonly type = '[Projects] Set Project Member';
  constructor(public member: ReadUser) {}
}
