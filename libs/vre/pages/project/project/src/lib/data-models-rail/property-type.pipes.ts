import { Pipe, PipeTransform } from '@angular/core';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';

/** The icon of a property's value type. */
@Pipe({ name: 'propertyTypeIcon' })
export class PropertyTypeIconPipe implements PipeTransform {
  transform(type: string): string {
    return typeIconOf(type);
  }
}

/** The name of a property's value type. */
@Pipe({ name: 'propertyTypeName' })
export class PropertyTypeNamePipe implements PipeTransform {
  transform(type: string): string {
    return typeNameOf(type);
  }
}
