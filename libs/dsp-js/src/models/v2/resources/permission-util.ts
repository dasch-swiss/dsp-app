/**
 * Utility methods to facilitate the handling of permissions defined for a resource or value.
 *
 * @category Model V2
 */
export namespace PermissionUtil {
  /**
   * Possible permissions on resources and values.
   */
  export enum Permissions {
    /**
     * restricted view
     */
    RV = 0,
    /**
     * view permission
     */
    V = 1,
    /**
     * modify permission
     */
    M = 2,
    /**
     * delete permission
     */
    D = 3,
    /**
     * change rights permission
     */
    CR = 4,
  }

  /**
   * Permission codes in ascending order.
   */
  const permissionHierarchy = [Permissions.RV, Permissions.V, Permissions.M, Permissions.D, Permissions.CR];

  /**
   * Given a permission, returns the permission and all implied permissions.
   *
   * @param highestPermission highest permission
   */
  const getAllPermissions = (highestPermission: Permissions) => {
    const givenPermIndex = permissionHierarchy.indexOf(highestPermission);

    if (givenPermIndex === -1) {
      throw new Error('Invalid permission given ' + highestPermission);
    }

    // return highest permission with all implied permissions
    // (slice does not return the element identified by the second arg 'end', so +1)
    return permissionHierarchy.slice(0, givenPermIndex + 1);
  };

  /**
   * Given a user's highest permission, returns all included permissions.
   *
   * @param highestUserPermissionString the user's highest permission.
   */
  export const allUserPermissions = (
    highestUserPermissionString: 'RV' | 'V' | 'M' | 'D' | 'CR'
  ): PermissionUtil.Permissions[] => {
    const perm: Permissions = Permissions[highestUserPermissionString];

    return getAllPermissions(perm);
  };
}
