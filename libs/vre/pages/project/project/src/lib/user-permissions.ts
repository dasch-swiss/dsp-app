import { Constants, ReadUser } from '@dasch-swiss/dsp-js';

export class UserPermissions {
  static hasSysAdminRights(user: ReadUser): boolean {
    return this._isPartOfProjectGroup(user, Constants.SystemProjectIRI, Constants.SystemAdminGroupIRI);
  }

  static hasProjectAdminRights(user: ReadUser, projectUuid: string): boolean {
    if (this.hasSysAdminRights(user)) {
      return true;
    }

    return this._isPartOfProjectGroup(user, projectUuid, Constants.ProjectAdminGroupIRI);
  }

  static hasProjectMemberRights(user: ReadUser, projectUuid: string): boolean {
    if (this.hasProjectAdminRights(user, projectUuid)) {
      return true;
    }

    return this._isPartOfProjectGroup(user, projectUuid, Constants.ProjectMemberGroupIRI);
  }

  private static _isPartOfProjectGroup(user: ReadUser, projectUuid: string, projectGroup: string): boolean {
    return user.permissions.groupsPerProject?.[projectUuid]?.includes(projectGroup) ?? false;
  }
}
