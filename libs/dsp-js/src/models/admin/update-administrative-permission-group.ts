import { JsonObject } from 'json2typescript';
import { UpdatePermissionGroup } from './update-permission-group';

/**
 * Update of an administrative permission's group.
 *
 * @category Model Admin
 */
@JsonObject('UpdateAdministrativePermissionGroup')
export class UpdateAdministrativePermissionGroup extends UpdatePermissionGroup {}
