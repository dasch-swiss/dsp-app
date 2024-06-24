import { PermissionUtil, ReadResource, ReadValue } from '@dasch-swiss/dsp-js';

export class ResourceUtil {
  public static userCanEdit(instance: ReadResource | ReadValue) {
    const permissions = PermissionUtil.allUserPermissions(instance.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR');
    return permissions.includes(PermissionUtil.Permissions.M);
  }

  public static userCanDelete(instance: ReadResource | ReadValue) {
    const permissions = PermissionUtil.allUserPermissions(instance.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR');
    return permissions.includes(PermissionUtil.Permissions.D);
  }
}
