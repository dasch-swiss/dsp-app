import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseFileValue } from '../type-specific-interfaces/base-file-value';
import { CreateValue } from './create-value';
import { License } from './license';

/**
 * @category Model V2
 */
@JsonObject('CreateFileValue')
export abstract class CreateFileValue extends CreateValue implements IBaseFileValue {
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
@JsonObject('CreateAudioFileValue')
export class CreateAudioFileValue extends CreateFileValue {
  constructor() {
    super(Constants.AudioFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateDocumentFileValue')
export class CreateDocumentFileValue extends CreateFileValue {
  constructor() {
    super(Constants.DocumentFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateMovingImageFileValue')
export class CreateMovingImageFileValue extends CreateFileValue {
  constructor() {
    super(Constants.MovingImageFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateStillImageFileValue')
export class CreateStillImageFileValue extends CreateFileValue {
  constructor() {
    super(Constants.StillImageFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateStillImageExternalFileValue')
export class CreateStillImageExternalFileValue extends CreateFileValue {
  @JsonProperty(Constants.StillImageFileValueHasExternalUrl, String, true)
  externalUrl?: string = '';
  constructor() {
    super(Constants.StillImageExternalFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateStillImageVectorFileValue')
export class CreateStillImageVectorFileValue extends CreateFileValue {
  constructor() {
    super(Constants.StillImageVectorFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateTextFileValue')
export class CreateTextFileValue extends CreateFileValue {
  constructor() {
    super(Constants.TextFileValue);
  }
}

/**
 * @category Model V2
 */
@JsonObject('CreateArchiveFileValue')
export class CreateArchiveFileValue extends CreateFileValue {
  constructor() {
    super(Constants.ArchiveFileValue);
  }
}
