declare namespace Cypress {
  export interface User {
    username: string;
    password: string;
  }

  export interface IRequestAuthenticatedParameters {
    url: string;
    body: any;
    isAuthenticated?: boolean;
  }

  export interface IUploadFileParameters {
    filePath: string;
    projectShortCode: string;
    isAuthenticated?: boolean;
    mimeType?: string;
  }
}
