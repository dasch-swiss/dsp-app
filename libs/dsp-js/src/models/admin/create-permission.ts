import { JsonObject } from 'json2typescript';
import { CreateUpdatePermission } from './create-update-permission';

/**
 * Creation of a permission.
 *
 * @category Model Admin
 */
@JsonObject('CreatePermission')
export class CreatePermission extends CreateUpdatePermission {}
