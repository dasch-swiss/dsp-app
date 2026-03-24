import { JsonObject } from 'json2typescript';

import { ListNodeResponse } from './list-node-response';

/**
 * A response containing a parent node.
 *
 * @category Model Admin
 */
@JsonObject('RepositionChildNodeResponse')
export class RepositionChildNodeResponse extends ListNodeResponse {}
