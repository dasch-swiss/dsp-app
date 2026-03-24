import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { StringOrArrayToArrayConverter } from '../../../custom-converters/string-or-array-converter';
import { UriConverter } from '../../../custom-converters/uri-converter';
import { License } from '../create/license';
import { IBaseFileValue } from '../type-specific-interfaces/base-file-value';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadFileValue')
export abstract class ReadFileValue extends ReadValue implements IBaseFileValue {
  @JsonProperty(Constants.FileValueHasFilename, String)
  filename: string = '';

  @JsonProperty(Constants.FileValueAsUrl, UriConverter)
  fileUrl: string = '';

  @JsonProperty(Constants.hasCopyrightHolder, String, true)
  copyrightHolder: string | null = null;

  @JsonProperty(Constants.hasAuthorship, StringOrArrayToArrayConverter, true)
  authorship: string[] = [];

  @JsonProperty(Constants.hasLicense, License, true)
  license: License | null = null;
}

/**
 * @category Model V2
 */
@JsonObject('ReadAudioFileValue')
export class ReadAudioFileValue extends ReadFileValue {
  @JsonProperty(Constants.AudioFileValueHasDuration, Number, true)
  duration?: number = 0;
}

/**
 * @category Model V2
 */
@JsonObject('ReadDocumentFileValue')
export class ReadDocumentFileValue extends ReadFileValue {
  @JsonProperty(Constants.DocumentFileValueHasDimX, Number, true)
  dimX?: number = 0;

  @JsonProperty(Constants.DocumentFileValueHasDimY, Number, true)
  dimY?: number = 0;

  @JsonProperty(Constants.DocumentFileValueHasPageCount, Number, true)
  pageCount?: number = 0;
}

/**
 * @category Model V2
 */
@JsonObject('ReadMovingImageFileValue')
export class ReadMovingImageFileValue extends ReadFileValue {
  @JsonProperty(Constants.MovingImageFileValueHasDimX, Number, true)
  dimX?: number = 0;

  @JsonProperty(Constants.MovingImageFileValueHasDimY, Number, true)
  dimY?: number = 0;

  @JsonProperty(Constants.MovingImageFileValueHasDuration, Number, true)
  duration?: number = 0;

  @JsonProperty(Constants.MovingImageFileValueHasFps, Number, true)
  fps?: number = 0;
}

/**
 * @category Model V2
 */
@JsonObject('ReadStillImageFileValue')
export class ReadStillImageFileValue extends ReadFileValue {
  @JsonProperty(Constants.StillImageFileValueHasDimX, Number)
  dimX: number = 0;

  @JsonProperty(Constants.StillImageFileValueHasDimY, Number)
  dimY: number = 0;

  @JsonProperty(Constants.StillImageFileValueHasIIIFBaseUrl, UriConverter)
  iiifBaseUrl: string = '';
}

/**
 * @category Model V2
 */
@JsonObject('ReadStillImageExternalFileValue')
export class ReadStillImageExternalFileValue extends ReadFileValue {
  @JsonProperty(Constants.StillImageFileValueHasExternalUrl, UriConverter, true)
  externalUrl: string = '';
}

/**
 * @category Model V2
 */
@JsonObject('ReadStillImageVectorFileValue')
export class ReadStillImageVectorFileValue extends ReadFileValue {
  // fileUrl inherited from ReadFileValue; no dimX/dimY for vector images
}

/**
 * @category Model V2
 */
@JsonObject('ReadArchiveFileValue')
export class ReadArchiveFileValue extends ReadFileValue {}

/**
 * @category Model V2
 */
@JsonObject('ReadTextFileValue')
export class ReadTextFileValue extends ReadFileValue {}
