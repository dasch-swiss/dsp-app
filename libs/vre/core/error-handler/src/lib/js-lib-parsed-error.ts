export class JsLibParsedError extends Error {
  constructor() {
    super(`JSLib parsed error. This comes from JS Lib not handling the API's response properly.`);
  }
}
