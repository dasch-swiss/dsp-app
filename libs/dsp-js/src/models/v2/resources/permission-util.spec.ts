import { PermissionUtil } from './permission-util';

describe('PermissionUtil', () => {
  describe('parse a permissions and calculate all permissions', () => {
    it("parse 'RV' and calculate all included permissions", () => {
      const allPerms = PermissionUtil.allUserPermissions('RV');

      expect(allPerms).toEqual([PermissionUtil.Permissions.RV]);
    });

    it("parse 'V' and calculate all included permissions", () => {
      const allPerms = PermissionUtil.allUserPermissions('V');

      expect(allPerms).toEqual([PermissionUtil.Permissions.RV, PermissionUtil.Permissions.V]);
    });

    it("parse 'M' and calculate all included permissions", () => {
      const allPerms = PermissionUtil.allUserPermissions('M');

      expect(allPerms).toEqual([
        PermissionUtil.Permissions.RV,
        PermissionUtil.Permissions.V,
        PermissionUtil.Permissions.M,
      ]);
    });

    it("parse 'D' and calculate all included permissions", () => {
      const allPerms = PermissionUtil.allUserPermissions('D');

      expect(allPerms).toEqual([
        PermissionUtil.Permissions.RV,
        PermissionUtil.Permissions.V,
        PermissionUtil.Permissions.M,
        PermissionUtil.Permissions.D,
      ]);
    });

    it("parse 'CR' and calculate all included permissions", () => {
      const allPerms = PermissionUtil.allUserPermissions('CR');

      expect(allPerms).toEqual([
        PermissionUtil.Permissions.RV,
        PermissionUtil.Permissions.V,
        PermissionUtil.Permissions.M,
        PermissionUtil.Permissions.D,
        PermissionUtil.Permissions.CR,
      ]);
    });
  });
});
