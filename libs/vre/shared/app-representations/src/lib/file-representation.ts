import {
  Constants,
  ReadArchiveFileValue,
  ReadAudioFileValue,
  ReadDocumentFileValue,
  ReadMovingImageFileValue,
  ReadStillImageFileValue,
} from '@dasch-swiss/dsp-js';
import { Region } from './region';

/**
 * represents a file value including its annotations.
 */
export class FileRepresentation {
  /**
   *
   * @param fileValue a [[ReadAudioFileValue | ReadDocumentFileValue | ReadMovingImageFileValue | ReadStillImageFileValue | ReadArchiveFileValue]] representing a file value
   * @param annotations[] an array of [[Region]] --> TODO: will be expanded with [[Sequence]]
   */
  constructor(
    readonly fileValue:
      | ReadAudioFileValue
      | ReadDocumentFileValue
      | ReadMovingImageFileValue
      | ReadStillImageFileValue
      | ReadArchiveFileValue,
    readonly annotations?: Region[]
  ) {}
}

export class RepresentationConstants {
  static audio = Constants.AudioFileValue;
  static document = Constants.DocumentFileValue;
  static movingImage = Constants.MovingImageFileValue;
  static stillImage = Constants.StillImageFileValue;
  static archive = Constants.ArchiveFileValue;
  static text = Constants.TextFileValue;
  static region = Constants.Region;
  static color = Constants.ColorValue;
}
