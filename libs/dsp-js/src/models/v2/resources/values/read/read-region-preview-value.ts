import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { DecimalConverter } from '../../../custom-converters/decimal-converter';
import { StringOrArrayToArrayConverter } from '../../../custom-converters/string-or-array-converter';
import { UriConverter } from '../../../custom-converters/uri-converter';
import { License } from '../create/license';
import { ReadValue } from './read-value';

/**
 * @category Model V2
 */
@JsonObject('ReadRegionPreviewValue')
export class ReadRegionPreviewValue extends ReadValue {
  // target reference (Region IRI) — populated imperatively in ResourcesConversionUtil, like a link target
  regionIri = '';

  // full-image identity — populated imperatively in ResourcesConversionUtil
  fullImageIri = '';
  fullImageLabel = '';

  // computed image-tier fields (always present for a value-visible user; Sipi enforces the pixels).
  // anyURI/decimal arrive as {@type,@value} typed literals — UriConverter/DecimalConverter (as
  // ReadFileValue.fileUrl / ReadDecimalValue.decimal do), NOT bare String/Number.
  @JsonProperty(Constants.HasPreviewCropUrl, UriConverter, true)
  cropUrl: string | null = null;

  @JsonProperty(Constants.HasPreviewThumbnailUrl, UriConverter, true)
  thumbnailUrl: string | null = null;

  @JsonProperty(Constants.HasPreviewHighlightBoxX, DecimalConverter, true)
  highlightBoxX: number | null = null;

  @JsonProperty(Constants.HasPreviewHighlightBoxY, DecimalConverter, true)
  highlightBoxY: number | null = null;

  @JsonProperty(Constants.HasPreviewHighlightBoxW, DecimalConverter, true)
  highlightBoxW: number | null = null;

  @JsonProperty(Constants.HasPreviewHighlightBoxH, DecimalConverter, true)
  highlightBoxH: number | null = null;

  // the region's color (knora-base:hasColor) — a bare hex string, used to tint the highlight box
  @JsonProperty(Constants.HasPreviewColor, String, true)
  color: string | null = null;

  // legal-info (from the full image) — same field names ReadFileValue exposes so resource-legal can consume it
  @JsonProperty(Constants.hasCopyrightHolder, String, true)
  copyrightHolder: string | null = null;

  @JsonProperty(Constants.hasAuthorship, StringOrArrayToArrayConverter, true)
  authorship: string[] = [];

  @JsonProperty(Constants.hasLicense, License, true)
  license: License | null = null;
}
