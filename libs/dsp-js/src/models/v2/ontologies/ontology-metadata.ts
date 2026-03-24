import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../Constants';
import { DateTimeStampConverter } from '../custom-converters/date-time-stamp-converter';
import { IdConverter } from '../custom-converters/id-converter';

/**
 * @category Model V2
 */
@JsonObject('OntologyMetadata')
export class OntologyMetadata {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty('@type', String)
  type: string = '';

  @JsonProperty(Constants.Label, String)
  label: string = '';

  @JsonProperty(Constants.Comment, String, true)
  comment?: string = undefined;

  @JsonProperty(Constants.LastModificationDate, DateTimeStampConverter, true)
  lastModificationDate?: string = undefined;

  @JsonProperty(Constants.AttachedToProject, IdConverter)
  attachedToProject: string = '';
}

/**
 * @category Model V2
 */
@JsonObject('OntologiesMetadata')
export class OntologiesMetadata {
  @JsonProperty('@graph', [OntologyMetadata])
  ontologies: OntologyMetadata[] = [];
}
