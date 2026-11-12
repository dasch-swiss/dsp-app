import { Constants, PermissionUtil } from '@dasch-swiss/dsp-js';
import { Interaction } from './resource.util';

/**
 * Returns `true` when the current user's permission on a raster *image* file value is restricted view,
 * i.e. the media server delivers the image in reduced size or watermarked (depending on the project settings).
 *
 * Restricted view only has a meaning for IIIF images: for every other file type (incl. vector and
 * external images) the media server treats it as full access, so no restriction must be shown.
 *
 * Asset permissions live on the file value, not on the resource: a resource may be restricted while
 * its image is not, and vice versa. Use this — never the resource's `userHasPermission` (DEV-7392).
 */
export function isRestrictedImage(fileValue: { type: string; userHasPermission: string } | null | undefined): boolean {
  return (
    fileValue?.type === Constants.StillImageFileValue &&
    PermissionUtil.Permissions[fileValue.userHasPermission as Interaction] === PermissionUtil.Permissions.RV
  );
}
