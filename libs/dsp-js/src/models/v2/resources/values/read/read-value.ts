import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DateTimeStampConverter } from '../../../custom-converters/date-time-stamp-converter';
import { IdConverter } from '../../../custom-converters/id-converter';
import { UriConverter } from '../../../custom-converters/uri-converter';
import { BaseValue } from '../base-value';

/**
 * @category Model V2
 */
@JsonObject('ReadValue')
export class ReadValue extends BaseValue {
  @JsonProperty('@id', String)
  id: string = '';

  @JsonProperty(Constants.AttachedToUser, IdConverter)
  attachedToUser: string = '';

  @JsonProperty(Constants.ArkUrl, UriConverter)
  arkUrl: string = '';

  @JsonProperty(Constants.VersionArkUrl, UriConverter)
  versionArkUrl: string = '';

  @JsonProperty(Constants.ValueCreationDate, DateTimeStampConverter)
  valueCreationDate: string = '';

  @JsonProperty(Constants.HasPermissions, String)
  hasPermissions: string = '';

  @JsonProperty(Constants.UserHasPermission, String)
  userHasPermission: string = '';

  @JsonProperty(Constants.ValueHasUUID, String)
  uuid: string = '';

  @JsonProperty(Constants.ValueHasComment, String, true)
  valueHasComment?: string = undefined;

  propertyLabel?: string;

  propertyComment?: string;

  property!: string;

  strval?: string;

  /**
   * @category Internal
   * @param id the id of the value.
   * @param type the type of the value.
   * @param attachedToUser the user the value is attached to.
   * @param arkUrl the value's persistent URL.
   * @param versionArkUrl the value's persistent URL for this version.
   * @param valueCreationDate the value's date of creation.
   * @param hasPermissions the permission set for the value.
   * @param userHasPermission the current user's permissions on the value.
   * @param uuid the value's UUID.
   * @param propertyLabel the label of the value's property.
   * @param propertyComment the comment of the value's property.
   * @param property the property pointing to the value.
   * @param strval the value's string representation, if any.
   * @param valueHasComment the comment on the value, if any.
   */
  constructor(
    id?: string,
    type?: string,
    attachedToUser?: string,
    arkUrl?: string,
    versionArkUrl?: string,
    valueCreationDate?: string,
    hasPermissions?: string,
    userHasPermission?: string,
    uuid?: string,
    propertyLabel?: string,
    propertyComment?: string,
    property?: string,
    strval?: string,
    valueHasComment?: string
  ) {
    super();

    if (id !== undefined) this.id = id;
    if (type !== undefined) this.type = type;
    if (attachedToUser !== undefined) this.attachedToUser = attachedToUser;
    if (arkUrl !== undefined) this.arkUrl = arkUrl;
    if (versionArkUrl !== undefined) this.versionArkUrl = versionArkUrl;
    if (valueCreationDate !== undefined) this.valueCreationDate = valueCreationDate;
    if (hasPermissions !== undefined) this.hasPermissions = hasPermissions;
    if (userHasPermission !== undefined) this.userHasPermission = userHasPermission;
    if (uuid !== undefined) this.uuid = uuid;
    if (propertyLabel !== undefined) this.propertyLabel = propertyLabel;
    if (propertyComment !== undefined) this.propertyComment = propertyLabel;
    if (property !== undefined) this.property = property;
    if (strval !== undefined) this.strval = strval;
    if (valueHasComment !== undefined) this.valueHasComment = valueHasComment;
  }
}
