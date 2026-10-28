/** The parts of a IIIF Image API 3.0 info.json the app reads; OpenSeadragon consumes the whole document. */
export interface IiifImageInfo {
  id?: string;
  '@id'?: string;
  width: number;
  height: number;
  preferredFormats?: string[];
  [key: string]: unknown;
}
