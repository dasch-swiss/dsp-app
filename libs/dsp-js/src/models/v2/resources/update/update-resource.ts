import { JsonObject } from 'json2typescript';
import { ReadWriteResource } from '../read-write-resource';
import { CreateValue } from '../values/create/create-value';
import { DeleteValue } from '../values/delete/delete-value';
import { UpdateValue } from '../values/update/update-value';

/**
 * Represents a resource with a value to be updated, created, or deleted.
 *
 * @category Model V2
 */
@JsonObject('UpdateResource')
export class UpdateResource<T extends UpdateValue | CreateValue | DeleteValue> extends ReadWriteResource {
  property!: string;
  value!: T;
}
