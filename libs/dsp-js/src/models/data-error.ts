import { ApiResponseError } from './api-response-error';

/**
 * Generic error class for API responses where the format was incorrect.
 *
 * @category Response
 */
export class DataError extends Error {
  /**
   * Constructor.
   */
  constructor(
    message: string,
    public response: ApiResponseError
  ) {
    super(message);

    // Check if the browser allows setting prototype, otherwise manually set it
    // We need to set the prototype to make sure "instanceof DataError" checks are working
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, DataError.prototype);
    } else {
      (this as any)['__proto__' as any] = DataError.prototype;
    }
  }
}
