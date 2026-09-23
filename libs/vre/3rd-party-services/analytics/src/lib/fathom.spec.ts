import { loadFathom } from './fathom';

describe('loadFathom', () => {
  const fathomScript = () => document.head.querySelector('script[data-site]');

  afterEach(() => {
    document.head.querySelectorAll('script[data-site]').forEach(script => script.remove());
  });

  it('injects the Fathom script for the production deployment', () => {
    loadFathom('prod');

    const script = fathomScript();
    expect(script?.getAttribute('src')).toBe('https://cdn.usefathom.com/script.js');
    expect(script?.getAttribute('data-site')).toBe('IMXRBKAX');
    expect(script?.getAttribute('data-spa')).toBe('auto');
    expect(script?.getAttribute('data-included-domains')).toBe('app.dasch.swiss');
  });

  it.each(['dev', 'stage', 'dev-server', 'ls-test', 'local-dev', 'production', ''])(
    'does not inject the Fathom script for environment %p',
    environmentName => {
      loadFathom(environmentName);

      expect(fathomScript()).toBeNull();
    }
  );
});
