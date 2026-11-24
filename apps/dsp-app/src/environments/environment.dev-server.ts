// Bazel copies one environment file to environment.ts per configuration (apps/dsp-app/BUILD.bazel).

import { APP_VERSION } from '@dasch-swiss/vre/core/config';

export const environment = {
  name: 'dev-server',
  production: false,
  version: APP_VERSION,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
