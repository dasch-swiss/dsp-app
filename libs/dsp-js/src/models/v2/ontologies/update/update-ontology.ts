import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { CreateResourceClass } from '../create/create-resource-class';
import { CreateResourceProperty } from '../create/create-resource-property';
import { UpdateDeleteEntity } from '../update-delete-entity';
import { UpdateEntityCommentOrLabel } from './update-entity-comment-or-label';
import { UpdateResourceClassCardinality } from './update-resource-class-cardinality';

/**
 * @category Model V2
 */
@JsonObject('UpdateOntology')
export class UpdateOntology<
  T extends CreateResourceClass | CreateResourceProperty | UpdateEntityCommentOrLabel | UpdateResourceClassCardinality,
> extends UpdateDeleteEntity {
  @JsonProperty('@type', String)
  type: string = Constants.Ontology;

  entity!: T;
}
