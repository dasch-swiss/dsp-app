import { JsonObject } from 'json2typescript';

import { ListNodeResponse } from './list-node-response';

/**
 * A response containing a list node.
 *
 * @category Model Admin
 */
@JsonObject('DeleteListNodeResponse')
export class DeleteListNodeResponse extends ListNodeResponse {}
