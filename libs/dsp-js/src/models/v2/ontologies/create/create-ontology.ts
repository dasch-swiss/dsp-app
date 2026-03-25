import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { IdConverter } from '../../custom-converters/id-converter';

/**
 * @category Model V2
 */
@JsonObject('CreateOntology')
export class CreateOntology {
  @JsonProperty(Constants.Label, String)
  label = '';

  @JsonProperty(Constants.Comment, String, true)
  comment?: string = undefined;

  @JsonProperty(Constants.AttachedToProject, IdConverter)
  attachedToProject = '';

  @JsonProperty(Constants.OntologyName, String)
  name = '';
}
