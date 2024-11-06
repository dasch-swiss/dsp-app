import { uploadProjectFile } from '../helpers/file-uploader';

function getJwt(isAuthenticated?: boolean) {
  return isAuthenticated === true ? localStorage.getItem('ACCESS_TOKEN') : Cypress.env('authToken');
}

function getRequestOptions(params: Cypress.IRequestAuthenticatedParameters): Cypress.RequestOptions {
  return {
    method: 'POST',
    url: params.url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getJwt(params.isAuthenticated)}`,
      Accept: '*/*',
      'X-Asset-Ingested': '1',
      'Accept-Encoding': 'gzip, deflate, br',
    },
    auth: undefined,
    body: params.body,
    encoding: 'utf8',
    followRedirect: false,
    form: false,
    gzip: false,
    qs: undefined,
    log: true,
    timeout: 0,
    failOnStatusCode: false,
    retryOnStatusCodeFailure: false,
    retryOnNetworkFailure: false,
  };
}

Cypress.Commands.add('postAuthenticated', (params: Cypress.IRequestAuthenticatedParameters) => {
  const cypressRequestOptions: Cypress.RequestOptions = getRequestOptions(params);
  return cy.request(cypressRequestOptions).then(response => {
    console.log(response);
  });
});

Cypress.Commands.add('createResource', (payload: any) => {
  const cypressRequestOptions: Cypress.RequestOptions = getRequestOptions({
    url: `${Cypress.env('apiUrl')}/v2/resources`,
    body: payload,
  });

  return cy.request(cypressRequestOptions).then(response => {
    console.log(response);
  });
});

Cypress.Commands.add('uploadFile', (uploadFileParameters: Cypress.IUploadFileParameters) =>
  cy.fixture(uploadFileParameters.filePath, 'binary').then(fileContent => {
    const jwt = getJwt(uploadFileParameters.isAuthenticated);
    return uploadProjectFile(
      uploadFileParameters.filePath,
      uploadFileParameters.mimeType,
      uploadFileParameters.projectShortCode,
      fileContent,
      jwt
    );
  })
);

Cypress.Commands.add('getCanvas', selector => {
  return cy.get(selector).then(canvas => canvas[0]);
});
