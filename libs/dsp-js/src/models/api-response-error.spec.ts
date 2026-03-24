import { AjaxError, AjaxResponse } from 'rxjs/ajax';
import { ApiResponseData } from './api-response-data';
import { ApiResponseError } from './api-response-error';

describe('Test class ApiResponseError', () => {
  describe('Test method fromAjaxError()', () => {
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
    const apiResponseError = ApiResponseError.fromAjaxError(ajaxError);

    it('should be an instance of ApiResponseError', () => {
      expect(apiResponseError).toEqual(expect.any(ApiResponseError));
    });

    it('should store the original error', () => {
      expect(apiResponseError.error).toBe(ajaxError);
    });
  });

  describe('Test method fromErrorString()', () => {
    const errorString = 'Error string';
    const mockXhr = {
      getAllResponseHeaders: () => '',
      status: 200,
      statusText: 'OK',
    } as any;
    const responseData = ApiResponseData.fromAjaxResponse(
      new AjaxResponse<object>({} as any, mockXhr, {
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
      })
    );
    const apiResponseError = ApiResponseError.fromErrorString(errorString, responseData);

    it('should be an instance of ApiResponseError', () => {
      expect(apiResponseError).toEqual(expect.any(ApiResponseError));
    });

    it('should store the original error', () => {
      expect(apiResponseError.error).toBe(errorString);
    });
  });
});
