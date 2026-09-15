import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { AccessTokenService } from './access-token.service';
import { apiConnectionTokenProvider } from './api-connection-token.provider';

/**
 * DEV-7249: the provider seeds the dsp-js connection's in-memory token at startup. It must go
 * through `AccessTokenService` so an expired or malformed token is never seeded — otherwise dsp-js
 * begins the page holding a token `AutoLoginService` is about to reject, and the two request
 * channels disagree for the rest of the page lifetime.
 */
describe('apiConnectionTokenProvider', () => {
  const VALID_TOKEN = 'valid-jwt';

  function seed(isValidToken: boolean, storedToken: string | null): string {
    const appConfigService = {
      dspApiConfig: { jsonWebToken: 'pre-existing', apiUrl: 'http://localhost:3333' },
    } as unknown as AppConfigService;
    const accessTokenService = {
      isValidToken: jest.fn().mockReturnValue(isValidToken),
      getAccessToken: jest.fn().mockReturnValue(storedToken),
    } as unknown as AccessTokenService;

    apiConnectionTokenProvider.useFactory(appConfigService, accessTokenService);

    return appConfigService.dspApiConfig.jsonWebToken;
  }

  it('seeds a valid stored token onto the connection config', () => {
    expect(seed(true, VALID_TOKEN)).toBe(VALID_TOKEN);
  });

  it('seeds an empty token when the stored one is expired or malformed', () => {
    expect(seed(false, 'expired-jwt')).toBe('');
  });

  it('seeds an empty token when nothing is stored', () => {
    expect(seed(true, null)).toBe('');
  });

  it('declares AccessTokenService as a dependency so validity is checked, not assumed', () => {
    expect(apiConnectionTokenProvider.deps).toContain(AccessTokenService);
  });
});
