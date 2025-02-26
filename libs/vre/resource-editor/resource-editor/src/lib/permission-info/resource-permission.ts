import { PermissionUtil, ReadResource } from '@dasch-swiss/dsp-js';
import { Interaction } from '@dasch-swiss/vre/resource-editor/representations';

export type UserGroup = 'ProjectAdmin' | 'Creator' | 'ProjectMember' | 'KnownUser' | 'UnknownUser' | 'CustomGroup';

export interface PermissionGroup {
  group: UserGroup | 'UsersPermissions';
  permissions: Permission[];
  label: string;
}

export interface Permission {
  interaction: Interaction;
  granted: boolean;
}

export interface PermissionHeaderItem {
  interaction: Interaction;
  label: string;
  icon: string;
}

export const USER_GROUP_LEVELS = new Map<UserGroup, number>([
  ['ProjectAdmin', 1],
  ['ProjectMember', 2],
  ['KnownUser', 3],
  ['UnknownUser', 4],
]);

export class GroupPermissionsUtil {
  private _groupsHighestPermission = new Map<UserGroup, PermissionUtil.Permissions>();
  private _customGroupsHighestPermission = new Map<string, PermissionUtil.Permissions>();

  constructor(resource: ReadResource) {
    resource.hasPermissions.split('|').forEach(section => {
      const [permissionKey, restrictedToGroupStr] = section.split(' ') as [Interaction, string];
      const permissionLevel = PermissionUtil.Permissions[permissionKey];
      const sectionSeparator = section.includes(',') ? ',' : ' ';
      const restrictedToGroups = restrictedToGroupStr
        .split(sectionSeparator)
        .filter(url => !url.startsWith('http://rdfh.ch/groups/')) // custom groups
        .map(url => {
          const urlSeparator = url.includes('#') ? '#' : ':';
          return url.split(urlSeparator)[1] as UserGroup;
        });

      restrictedToGroups.forEach(group => this._groupsHighestPermission.set(group, permissionLevel));

      const customGroups = restrictedToGroupStr // custom groups a project might define
        .split(sectionSeparator)
        .filter(url => url.startsWith('http://rdfh.ch/groups/'));

      customGroups.forEach(iri => this._customGroupsHighestPermission.set(iri, permissionLevel));
    });
  }

  isInteractionGrantedForGroup(interaction: Interaction, userGroup: UserGroup): boolean {
    const requiredPermission = PermissionUtil.Permissions[interaction];

    const groupsWithEqualOrLessPrivilege = [...USER_GROUP_LEVELS.entries()].filter(
      ([_, rank]) => rank >= (USER_GROUP_LEVELS.get(userGroup) || 5)
    );
    const grantedPermissions = groupsWithEqualOrLessPrivilege
      .map(([group]) => this._groupsHighestPermission.get(group))
      .filter((permission): permission is PermissionUtil.Permissions => permission !== undefined);

    const highestGrantedPermission = grantedPermissions.length > 0 ? Math.max(...grantedPermissions) : 0;

    return highestGrantedPermission >= requiredPermission;
  }

  get customGroups() {
    return this._customGroupsHighestPermission;
  }

  isInteractionGrantedForCustomGroup(interaction: Interaction, iri: string): boolean {
    const highestGrantedPermission = this._customGroupsHighestPermission.get(iri) || 0;
    return highestGrantedPermission >= PermissionUtil.Permissions[interaction];
  }
}
