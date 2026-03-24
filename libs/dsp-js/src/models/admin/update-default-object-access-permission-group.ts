import { JsonObject } from 'json2typescript';
import { UpdatePermissionGroup } from './update-permission-group';

/**
 * Update of a default object access permission's group.
 *
 * @category Model Admin
 */
@JsonObject('UpdateDefaultObjectAccessPermissionGroup')
export class UpdateDefaultObjectAccessPermissionGroup extends UpdatePermissionGroup {}
