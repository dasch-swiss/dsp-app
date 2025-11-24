import { ClassPropertyPayloads } from './property-definition-payloads';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
});

export class ResponseUtil {
  static lastModificationDate = (response: any): string => {
    return response.body['knora-api:lastModificationDate']['@value'];
  };
}

export class ResourceRequests {
  static resourceRequest = (payload: any, required = false): Cypress.Chainable => {
    return cy
      .request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/v2/ontologies/properties`,
        headers: getAuthHeaders(),
        body: payload,
      })
      .then(response => {
        const modificationDate = ResponseUtil.lastModificationDate(response);
        console.log(response);
        return cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/v2/ontologies/cardinalities`,
          headers: getAuthHeaders(),
          body: ClassPropertyPayloads.cardinality(modificationDate, required),
        });
      });
  };
}
