import { Constants, StringLiteralV2 } from '@dasch-swiss/dsp-js';

export const ResourceLabel = `${Constants.KnoraApiV2 + Constants.HashDelimiter}ResourceLabel`;
export const RDFS_LABEL = 'rdfs:label';
export const MAIN_RESOURCE_PLACEHOLDER = '?mainRes';
export const RESOURCE_PLACEHOLDER = '?res';
export const VALUE_SUFFIX = 'val';
export const RDFS_TYPE = 'a';

/**
 * i18n key for the app-owned label of the synthetic `rdfs:label` predicate.
 * The backend never returns `rdfs:label` in an ontology's property list, so
 * `OntologyDataService` prepends it to every predicate stream using this key
 * to resolve labels per locale via `TranslateService.getTranslation`.
 */
export const RESOURCE_LABEL_TRANSLATION_KEY = 'pages.search.advancedSearch.resourceLabel';

/**
 * Sentinel `IriLabelPair` representing "search across all resource classes".
 * Downstream (gravsearch.service.ts) keys off the empty `iri`.
 *
 * Typed inline (not via `IriLabelPair`) to avoid a circular `model.ts → constants.ts → model.ts` import.
 */
export const ALL_RESOURCE_CLASSES: { iri: string; labels: StringLiteralV2[]; comments: StringLiteralV2[] } = {
  iri: '',
  labels: [],
  comments: [],
};

/** Alias for ALL_RESOURCE_CLASSES — sentinel representing "search across all resource classes". */
export const SEARCH_ALL_RESOURCE_CLASSES_OPTION = ALL_RESOURCE_CLASSES;
