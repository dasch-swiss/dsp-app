import { JsonObject } from 'json2typescript';
import { ReadResource } from '../../read/read-resource';
import { IBaseLinkValue } from '../type-specific-interfaces/base-link-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadLinkValue')
export class ReadLinkValue extends ReadValue implements IBaseLinkValue {
  linkedResource?: ReadResource;

  linkedResourceIri!: string;

  incoming!: boolean;
}
