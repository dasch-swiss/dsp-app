import { JsonObject, JsonProperty } from 'json2typescript';
import { CreateUpdatePermission } from './create-update-permission';

/**
 * Update of a permission.
 *
 * @category Model Admin
 */
@JsonObject('UpdatePermission')
export class UpdatePermission extends CreateUpdatePermission {}
