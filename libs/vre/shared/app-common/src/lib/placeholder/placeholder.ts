export const PLACEHOLDER_IRI = 'urn:placeholder';

export function isPlaceholderValue(value: string | null | undefined): boolean {
  return value === PLACEHOLDER_IRI;
}

export function isPlaceholderAsset(fileValue: { filename?: string } | null | undefined): boolean {
  return isPlaceholderValue(fileValue?.filename);
}

export function isPlaceholderAuthorship(authorship: string[] | null | undefined): boolean {
  return !!authorship?.some(isPlaceholderValue);
}
