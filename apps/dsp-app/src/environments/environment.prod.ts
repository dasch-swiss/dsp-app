import packageJson from '../../../../package.json';

export const environment = {
  name: 'prod',
  production: true,
  version: packageJson.version,
};
