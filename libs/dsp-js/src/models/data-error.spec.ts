import { AjaxError } from 'rxjs/ajax';
import { ApiResponseError } from './api-response-error';
import { DataError } from './data-error';

describe('Test class DataError', () => {
  describe('Test method constructor()', () => {
    const ajaxError = new AjaxError('Error', new XMLHttpRequest(), {
      url: 'test-url',
      method: 'GET',
      async: true,
      headers: {},
      timeout: 0,
      user: undefined,
      password: undefined,
      crossDomain: false,
      responseType: 'json',
      withCredentials: false,
    });
    const dataError = new DataError('Error', ApiResponseError.fromAjaxError(ajaxError));

    it('should be an instance of Error', () => {
      expect(dataError).toEqual(expect.any(Error));
    });

    it('should be an instance of DataError', () => {
      expect(dataError).toEqual(expect.any(DataError));
    });
  });
});
