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
  // target reference (Region IRI + label) — populated imperatively in ResourcesConversionUtil, like a link target
  regionIri = '';
  regionLabel = '';

  // full-image identity — populated imperatively in ResourcesConversionUtil
  fullImageIri = '';
  fullImageLabel = '';

  // computed image-tier fields (always present for a value-visible user; Sipi enforces the pixels).
  // anyURI/decimal arrive as {@type,@value} typed literals — UriConverter/DecimalConverter (as
  // ReadFileValue.fileUrl / ReadDecimalValue.decimal do), NOT bare String/Number.
  @JsonProperty(Constants.HasPreviewUrl, UriConverter, true)
  cropUrl: string | null = null;

  @JsonProperty(Constants.HasThumbnailUrl, UriConverter, true)
  thumbnailUrl: string | null = null;

  @JsonProperty(Constants.HasHighlightBoxX, DecimalConverter, true)
  highlightBoxX: number | null = null;

  @JsonProperty(Constants.HasHighlightBoxY, DecimalConverter, true)
  highlightBoxY: number | null = null;

  @JsonProperty(Constants.HasHighlightBoxW, DecimalConverter, true)
  highlightBoxW: number | null = null;

  @JsonProperty(Constants.HasHighlightBoxH, DecimalConverter, true)
  highlightBoxH: number | null = null;

  // the region's color (knora-base:hasColor) — a bare hex string
  @JsonProperty(Constants.HasPreviewColor, String, true)
  color: string | null = null;

  // legal-info (from the full image) — read from the dedicated hasFullImage* predicates, but exposed under the
  // same field names ReadFileValue uses so the shared resource-legal component can consume it unchanged.
  @JsonProperty(Constants.HasFullImageCopyrightHolder, String, true)
  copyrightHolder: string | null = null;

  @JsonProperty(Constants.HasFullImageAuthorship, StringOrArrayToArrayConverter, true)
  authorship: string[] = [];

  @JsonProperty(Constants.HasFullImageLicense, License, true)
  license: License | null = null;
}
