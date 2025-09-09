/**
 * a list, which is used in the mat-autocomplete form field
 * contains objects with id and name. the id is usual the iri
 */
export interface AutocompleteItem {
  iri: string;
  name: string;
  label?: string;
}
