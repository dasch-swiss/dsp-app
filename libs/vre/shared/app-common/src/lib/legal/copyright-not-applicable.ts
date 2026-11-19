/**
 * Licenses under which a legal field does not apply, so an empty field reads "Not applicable"
 * rather than "Not specified".
 *
 * Mirrors the public rule page (dasch-swiss-website, knowledge hub "Authorship, Copyright &
 * Licenses"): a work that is not protected by copyright has no copyright holder, and AI-generated
 * output has no human author. CC0 is included because the creator waives all rights.
 *
 * This is an interim list. Once the dsp-api license catalog states whether copyright applies to a
 * license, read that flag instead and delete this file.
 */
const HOLDER_NOT_APPLICABLE: ReadonlySet<string> = new Set([
  'http://rdfh.ch/licenses/public-domain',
  'http://rdfh.ch/licenses/cc-pdm-1.0',
  'http://rdfh.ch/licenses/cc-0-1.0',
  'http://rdfh.ch/licenses/ai-generated',
]);

const AUTHORSHIP_NOT_APPLICABLE: ReadonlySet<string> = new Set(['http://rdfh.ch/licenses/ai-generated']);

/** Returns `true` when a file under this license has no copyright holder by definition. */
export function isCopyrightHolderNotApplicable(licenseIri: string | null | undefined): boolean {
  return !!licenseIri && HOLDER_NOT_APPLICABLE.has(licenseIri);
}

/** Returns `true` when a file under this license has no author by definition. */
export function isAuthorshipNotApplicable(licenseIri: string | null | undefined): boolean {
  return !!licenseIri && AUTHORSHIP_NOT_APPLICABLE.has(licenseIri);
}
