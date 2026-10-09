/**
 * Returns `true` when the current user's permission on the *file value* is `RV` (restricted view),
 * i.e. the asset itself is served in a degraded form.
 *
 * Asset permissions live on the file value, not on the resource: a resource may be `RV` while its
 * file value is `V` (full-quality asset), and vice versa. Use this — never the resource's
 * `userHasPermission` — to decide whether to tell the user the asset is degraded (DEV-7392).
 *
 * Typed structurally so it serves both `ReadFileValue` and the player-facing
 * `FileRepresentationInput`.
 */
export function isRestrictedFileValue(fileValue: { userHasPermission: string } | null | undefined): boolean {
  return fileValue?.userHasPermission === 'RV';
}
