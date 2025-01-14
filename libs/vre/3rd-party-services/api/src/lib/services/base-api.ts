import { KnoraApiConfig } from '@dasch-swiss/dsp-js/src/knora-api-config';

export abstract class BaseApi {
  protected baseUri: string;
  constructor(endpoint: string, apiConfig: KnoraApiConfig) {
    const host = apiConfig.apiUrl;
    this.baseUri = `${host}/${endpoint}`;
  }
}
