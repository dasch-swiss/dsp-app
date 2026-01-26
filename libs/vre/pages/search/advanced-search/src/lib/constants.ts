import { Constants } from '@dasch-swiss/dsp-js';
import { IriLabelPair } from './model';

export const ResourceLabel = `${Constants.KnoraApiV2 + Constants.HashDelimiter}ResourceLabel`;
export const RDFS_LABEL = 'rdfs:label';

export const SEARCH_ALL_RESOURCE_CLASSES_OPTION: IriLabelPair = {
  iri: '',
  label: 'All resource classes',
} as const;
