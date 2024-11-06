import { UploadedFileResponse } from '../../../../../libs/vre/shared/app-representations/src';

export function uploadProjectFile(
  filePath: string,
  mimeType: string,
  shortcode: string,
  fileContent: string,
  jwt: string
) {
  const blob = Cypress.Blob.binaryStringToBlob(fileContent, mimeType);
  const fileName = filePath.split('/').pop();
  const headers = {
    'Content-Type': 'application/octet-stream',
    Authorization: `Bearer ${jwt}`,
    'Accept-Encoding': '*',
    'X-Asset-Ingested': '1',
  };
  const encodedFilename = encodeURIComponent(fileName);
  const url = `${Cypress.env('dspIngestUrl')}/projects/${shortcode}/assets/ingest/${encodedFilename}`;

  const options = {
    body: blob,
    headers: headers,
    method: 'POST',
    url: url,
  };

  return cy.request(options).then(response => {
    cy.log(`File ${fileName} uploaded!`);
    return Cypress.Blob.arrayBufferToBlob(response.body)
      .text()
      .then(text => {
        const obj = JSON.parse(text) as UploadedFileResponse;
        cy.log(`File ${obj.internalFilename} created!`);
        return obj;
      });
  });
}
