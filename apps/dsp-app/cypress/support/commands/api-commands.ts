import { uploadProjectFile } from '../helpers/file-uploader';

function getJwt(isAuthenticated?: boolean) {
  return isAuthenticated === true ? Cypress.env('authToken') : localStorage.getItem('ACCESS_TOKEN');
}

function getRequestOptions(params: Cypress.IRequestAuthenticatedParameters): Partial<Cypress.RequestOptions> {
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
    body: params.body,
    encoding: 'utf8',
    followRedirect: false,
    form: false,
    gzip: false,
    log: true,
    timeout: 0,
    failOnStatusCode: false,
    retryOnStatusCodeFailure: false,
    retryOnNetworkFailure: false,
  };
}

Cypress.Commands.add('postAuthenticated', (params: Cypress.IRequestAuthenticatedParameters) => {
  const cypressRequestOptions = getRequestOptions(params) as Cypress.RequestOptions;
  return cy.request(cypressRequestOptions).then(response => {
    console.log(response);
  });
});

Cypress.Commands.add('createResource', (payload: any, isAuthenticated: boolean = false) => {
  const cypressRequestOptions = getRequestOptions({
    url: `${Cypress.env('apiUrl')}/v2/resources`,
    body: payload,
    isAuthenticated: isAuthenticated,
  }) as Cypress.RequestOptions;

  return cy.request(cypressRequestOptions).then(response => {
    console.log(response);
  });
});

Cypress.Commands.add('uploadFile', (uploadFileParameters: Cypress.IUploadFileParameters) =>
  cy.fixture(uploadFileParameters.filePath, 'binary').then(fileContent => {
    const jwt = getJwt(uploadFileParameters.isAuthenticated) ?? '';
    return uploadProjectFile(
      uploadFileParameters.filePath,
      uploadFileParameters.mimeType!,
      uploadFileParameters.projectShortCode,
      fileContent,
      jwt
    );
  })
);

Cypress.Commands.add('getCanvas', selector => {
  return cy.get(selector).then(canvas => canvas[0]);
});
