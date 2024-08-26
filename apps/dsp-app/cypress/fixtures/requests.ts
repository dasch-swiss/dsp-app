import { ClassPropertyPayloads } from './property-definition-payloads';

export class ResponseUtil {
  static lastModificationDate = (response: any): string => {
    return response.body['knora-api:lastModificationDate']['@value'];
  };
}

export class ResourceRequests {
  static resourceRequest = (payload: any, required = false): Cypress.Chainable => {
    return cy.request('POST', `${Cypress.env('apiUrl')}/v2/ontologies/properties`, payload).then(response => {
      const modificationDate = ResponseUtil.lastModificationDate(response);
      console.log(response);
      return cy.request(
        'POST',
        `${Cypress.env('apiUrl')}/v2/ontologies/cardinalities`,
        ClassPropertyPayloads.cardinality(modificationDate, required)
      );
    });
  };
}
