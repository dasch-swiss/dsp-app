import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../Constants';
import { DateTimeStampConverter } from '../../custom-converters/date-time-stamp-converter';
import { IdConverter } from '../../custom-converters/id-converter';
import { UriConverter } from '../../custom-converters/uri-converter';
import { ResourcePropertyDefinition } from '../../ontologies/resource-property-definition';
import { ReadWriteResource } from '../read-write-resource';
import { TypeGuard } from '../type-guard';
import { ReadValue } from '../values/read/read-value';
import { ResourceClassAndPropertyDefinitions } from '../../../../cache/ontology-cache/resource-class-and-property-definitions';

/**
 * @category Model V2
 */
@JsonObject('ReadResource')
export class ReadResource extends ReadWriteResource {
  @JsonProperty(Constants.Label, String)
  label: string = '';

  @JsonProperty(Constants.AttachedToProject, IdConverter)
  attachedToProject: string = '';

  @JsonProperty(Constants.AttachedToUser, IdConverter)
  attachedToUser: string = '';

  @JsonProperty(Constants.HasPermissions, String)
  hasPermissions: string = '';

  @JsonProperty(Constants.UserHasPermission, String)
  userHasPermission: string = '';

  @JsonProperty(Constants.ArkUrl, UriConverter)
  arkUrl: string = '';

  @JsonProperty(Constants.VersionArkUrl, UriConverter)
  versionArkUrl: string = '';

  @JsonProperty(Constants.CreationDate, DateTimeStampConverter)
  creationDate: string = '';

  @JsonProperty(Constants.LastModificationDate, DateTimeStampConverter, true)
  lastModificationDate?: string = undefined;

  @JsonProperty(Constants.DeleteDate, DateTimeStampConverter, true)
  deleteDate?: string = undefined;

  @JsonProperty(Constants.DeleteComment, String, true)
  deleteComment?: string = '';

  @JsonProperty(Constants.IsDeleted, Boolean, true)
  isDeleted?: boolean = false;

  resourceClassLabel?: string;

  resourceClassComment?: string;

  entityInfo!: ResourceClassAndPropertyDefinitions;

  properties: { [index: string]: ReadValue[] } = {};

  incomingReferences: ReadResource[] = [];

  outgoingReferences: ReadResource[] = [];

  /**
   * Gets number of resource properties for this resource.
   * Each resource property is counted once,
   * regardless of how many values it has (if number of values > 1).
   */
  getNumberOfProperties(): number {
    return Object.keys(this.properties).length;
  }

  /**
   * Gets the number of values for a given resource property.
   *
   * @param property the IRI of the property.
   */
  getNumberOfValues(property: string): number {
    if (this.properties.hasOwnProperty(property)) {
      return this.properties[property].length;
    } else {
      return 0;
    }
  }

  /**
   * Gets the value type of a given resource property,
   * or `false` if cannot be determined.
   *
   * @param property the IRI of the property.
   */
  getValueType(property: string): string | false {
    if (
      this.entityInfo.properties.hasOwnProperty(property) &&
      this.entityInfo.properties[property].objectType !== undefined
    ) {
      return this.entityInfo.properties[property].objectType as string;
    } else {
      return false;
    }
  }

  /**
   * Given the IRI of a property pointing to a link value,
   * returns the corresponding link property IRI.
   *
   * @param linkValueProperty IRI of the link value property.
   */
  getLinkPropertyIriFromLinkValuePropertyIri(linkValueProperty: string): string {
    if (
      this.entityInfo.properties[linkValueProperty] !== undefined &&
      this.entityInfo.properties[linkValueProperty] instanceof ResourcePropertyDefinition &&
      (this.entityInfo.properties[linkValueProperty] as ResourcePropertyDefinition).isLinkValueProperty &&
      linkValueProperty.endsWith('Value')
    ) {
      // remove "Value" from the end of the string and return the Iri
      const linkPropIri = linkValueProperty.substring(0, linkValueProperty.length - 5);

      if (
        this.entityInfo.properties[linkPropIri] !== undefined &&
        this.entityInfo.properties[linkPropIri] instanceof ResourcePropertyDefinition &&
        (this.entityInfo.properties[linkPropIri] as ResourcePropertyDefinition).isLinkProperty
      ) {
        return linkPropIri;
      } else {
        throw new Error(`Could not determine link property IRI for ${linkValueProperty}`);
      }
    } else {
      throw new Error(`${linkValueProperty} is not a valid link value property IRI`);
    }
  }

  /**
   * Gets all the values for a given resource property.
   *
   * @param property the IRI of the property.
   */
  getValues(property: string): ReadValue[] {
    if (this.properties.hasOwnProperty(property)) {
      return this.properties[property];
    } else {
      return [];
    }
  }

  /**
   * Gets an array of string values representing the values of a property.
   *
   * @param property the IRI of the property.
   * @param defaultStr placeholder if there is no string representation of a value.
   */
  getValuesAsStringArray(property: string, defaultStr: string = '?'): string[] {
    const vals: ReadValue[] = this.getValues(property);
    return vals.map((val: ReadValue) => {
      return val.strval === undefined ? defaultStr : val.strval;
    });
  }

  /**
   * Gets all the values for a given resource property as instances of the requested type.
   * If the value cannot be casted to the requested type, an error is thrown.
   *
   * @param property the IRI of the property.
   * @param valueType the requested type of the value.
   */
  getValuesAs<T extends ReadValue>(property: string, valueType: TypeGuard.Constructor<T>): T[] {
    return this.getValues(property).map(val => {
      if (TypeGuard.typeGuard(val, valueType)) {
        return val as T;
      } else {
        throw new Error('Cannot cast to type ' + valueType);
      }
    });
  }
}
