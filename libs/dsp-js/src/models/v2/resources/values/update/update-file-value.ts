import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { License } from '../create/license';
import { IBaseFileValue } from '../type-specific-interfaces/base-file-value';
import { UpdateValue } from './update-value';

/**
 * @category Model V2
 */
@JsonObject('UpdateFileValue')
export abstract class UpdateFileValue extends UpdateValue implements IBaseFileValue {
  @JsonProperty(Constants.FileValueHasFilename, String)
  filename: string = '';

  @JsonProperty(Constants.hasCopyrightHolder, String, true)
  copyrightHolder!: string;

  @JsonProperty(Constants.hasAuthorship, [String], true)
  authorship!: string[];

  @JsonProperty(Constants.hasLicense, License, true)
  license!: License;
}

/**
 * @category Model V2
 */
@JsonObject('UpdateAudioFileValue')
export class UpdateAudioFileValue extends UpdateFileValue {
  constructor() {
    super(Constants.AudioFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('UpdateDocumentFileValue')
export class UpdateDocumentFileValue extends UpdateFileValue {
  constructor() {
    super(Constants.DocumentFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('UpdateMovingImageFileValue')
export class UpdateMovingImageFileValue extends UpdateFileValue {
  constructor() {
    super(Constants.MovingImageFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('UpdateStillImageFileValue')
export class UpdateStillImageFileValue extends UpdateFileValue {
  constructor() {
    super(Constants.StillImageFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('UpdateStillImageExternalFileValue')
export class UpdateExternalStillImageFileValue extends UpdateFileValue {
  @JsonProperty(Constants.StillImageFileValueHasExternalUrl, String, true)
  externalUrl!: string;
  constructor() {
    super(Constants.StillImageExternalFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('UpdateStillImageVectorFileValue')
export class UpdateStillImageVectorFileValue extends UpdateFileValue {
  constructor() {
    super(Constants.StillImageVectorFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('UpdateTextFileValue')
export class UpdateTextFileValue extends UpdateFileValue {
  constructor() {
    super(Constants.TextFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('UpdateArchiveFileValue')
export class UpdateArchiveFileValue extends UpdateFileValue {
  constructor() {
    super(Constants.ArchiveFileValue);
  }
}
