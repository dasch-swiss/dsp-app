import { PermissionUtil } from '@dasch-swiss/dsp-js';

export type Interaction = keyof typeof PermissionUtil.Permissions; // "RV" | "V" | "M" | "D" | "CR"

export class ResourceUtil {
  public static userCanView(instance: { userHasPermission: string }) {
    return ResourceUtil.isInteractionGranted(instance, 'V');
  }

  public static userCanEdit(instance: { userHasPermission: string }) {
    return ResourceUtil.isInteractionGranted(instance, 'M');
  }

  public static userCanDelete(instance: { userHasPermission: string }) {
    return ResourceUtil.isInteractionGranted(instance, 'D');
  }

  public static isInteractionGranted(resource: { userHasPermission: string }, interaction: Interaction): boolean {
    const permissions = PermissionUtil.allUserPermissions(resource.userHasPermission as Interaction);
    return permissions.includes(PermissionUtil.Permissions[interaction]);
  }

  public static versionIsValid(version: string) {
    return version.match(/^[0-9]{8}T[0-9]{6,15}Z$/) !== null;
  }
}
