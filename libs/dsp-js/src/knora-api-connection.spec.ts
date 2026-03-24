import { AdminEndpoint } from './api/admin/admin-endpoint';
import { V2Endpoint } from './api/v2/v2-endpoint';
import { KnoraApiConfig } from './knora-api-config';
import { KnoraApiConnection } from './knora-api-connection';

describe('Test class KnoraApiConnection', () => {
  const config = new KnoraApiConfig('http', 'localhost', 4321);

  describe('Test method constructor()', () => {
    const connection = new KnoraApiConnection(config);

    it('should create the AdminEndpoint', () => {
      expect(connection.admin).toEqual(expect.any(AdminEndpoint));
    });

    it('should create the V2Endpoint', () => {
      expect(connection.v2).toEqual(expect.any(V2Endpoint));
    });
  });
});
