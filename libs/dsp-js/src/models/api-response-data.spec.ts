import { JsonConvert, JsonObject, JsonProperty, OperationMode, ValueCheckingMode } from 'json2typescript';
import { ApiResponseData } from './api-response-data';

describe('Test class ApiResponseData', () => {
  // Setup json convert instance
  const jsonConvert = new JsonConvert(OperationMode.ENABLE, ValueCheckingMode.DISALLOW_NULL, false);

  describe('Test method fromAjaxResponse()', () => {
    // Setup a test class for responses
    @JsonObject('Person')
    class Person {
      @JsonProperty('id', Number) id: number = 0;
      @JsonProperty('name', String) name: string = '';
    }

    // Set up interface for data
    interface IAjaxResponse {
      request: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
        url: string;
      };
      xhr: {
        status: number;
      };
      response: {
        id: number;
        name: string;
      };
    }

    // Generate data
    const ajaxResponses: IAjaxResponse[] = [
      {
        request: { method: 'GET', url: 'http://localhost' },
        xhr: { status: 200 },
        response: { id: 123, name: 'Test' },
      },
      {
        request: { method: 'GET', url: 'http://knora.org' },
        xhr: { status: 201 },
        response: { id: 1337, name: 'Gaga' },
      },
      {
        request: { method: 'PUT', url: 'htt://0.0.0.0' },
        xhr: { status: 200 },
        response: { id: 1893, name: 'Hello' },
      },
      {
        request: { method: 'GET', url: 'https://dasch.swiss' },
        xhr: { status: 200 },
        response: { id: 0, name: 'World' },
      },
      {
        request: { method: 'POST', url: 'https://salsah.org' },
        xhr: { status: 500 },
        response: { id: 1, name: 'Earth' },
      },
    ];

    it('should verify parameters', () => {
      ajaxResponses.forEach((ajaxResponse: IAjaxResponse) => {
        const apiResponseData = ApiResponseData.fromAjaxResponse(ajaxResponse as any, Person, jsonConvert);

        // should match request method and url
        expect(apiResponseData.url).toBe(ajaxResponse.request.url);
        expect(apiResponseData.method).toBe(ajaxResponse.request.method);

        // should match response status
        expect(apiResponseData.status).toBe(ajaxResponse.xhr.status);

        // should match response object
        expect(apiResponseData.response).toEqual(ajaxResponse as any);

        // should match response body
        const person = new Person();
        person.id = ajaxResponse.response.id;
        person.name = ajaxResponse.response.name;

        expect(apiResponseData.body).toEqual(person);
      });
    });
  });
});
