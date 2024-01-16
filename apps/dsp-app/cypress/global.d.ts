declare namespace Cypress {
  // I can't import User from user-profiles without the linter breaking and idk why
  interface User {
    username: string;
    password: string;
  }

  interface Chainable<Subject> {
    // logs user in via the API
    login(user: User): void;
  }
}
