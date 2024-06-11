export interface MovingImageSidecar {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '@context': string;
  checksumDerivative: string;
  checksumOriginal: string;
  duration: number;
  fileSize: number;
  fps: number;
  height: number;
  id: string;
  internalMimeType: string;
  originalFilename: string;
  width: number;
}
