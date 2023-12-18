export abstract class BaseApi {
    protected baseUri: string;
    constructor(endpoint: string) {
    const host = 'http://0.0.0.0:3333';
    this.baseUri = `${host}/${endpoint}`;
    }
}
