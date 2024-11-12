declare namespace Cypress {
  interface Chainable<Subject> {
    resetDatabase(): void;
    // logs user in via the API
    login(user: User): Chainable<Subject>;
    // logs user out
    logout(): void;
    // logs system admin in
    loginAdmin(): Chainable<Subject>;
    //creates resource request by project admin or authenticated user
    createResource(payload: any, isAuthenticated?: boolean): Chainable<Subject>;
    //creates POST request with Auth token
    postAuthenticated(params: IRequestAuthenticatedParameters): Chainable<Subject>;
    //creates GET request with Auth token
    getAuthenticated(params: IRequestAuthenticatedParameters): Chainable<Subject>;
    //uploads file request
    uploadFile(params: IUploadFileParameters): Chainable<Subject>;
    //gets resource canvas element
    getCanvas(selector: string): Chainable<Subject>;
  }
}
