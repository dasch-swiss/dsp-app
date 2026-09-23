const FATHOM_SCRIPT_URL = 'https://cdn.usefathom.com/script.js';
const FATHOM_SITE_ID = 'IMXRBKAX';
const PRODUCTION_ENVIRONMENT = 'prod';
const PRODUCTION_DOMAIN = 'app.dasch.swiss';

/**
 * Gates on the deployment's runtime `instrumentation.environment`, never on
 * `environment.production`: dev, stage and ls-test run the same production-built image as prod.
 */
export function loadFathom(environmentName: string): void {
  if (environmentName !== PRODUCTION_ENVIRONMENT) {
    return;
  }

  const script = document.createElement('script');
  script.src = FATHOM_SCRIPT_URL;
  script.dataset['site'] = FATHOM_SITE_ID;
  script.dataset['spa'] = 'auto';
  script.dataset['includedDomains'] = PRODUCTION_DOMAIN;
  document.head.appendChild(script);
}
