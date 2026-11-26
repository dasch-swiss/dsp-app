import { FeatureTourChannel } from '@dasch-swiss/vre/ui/ui';

/**
 * The feature-tour channel of a deployment, from its `instrumentation.environment`: the deployed
 * values (`dev`, `stage`, `prod`, …) and the local configurations in `src/config/`. Anything else
 * counts as production, the safe default.
 */
export function featureTourChannel(environment: string): FeatureTourChannel {
  switch (environment) {
    case 'dev':
    case 'local-dev':
    case 'dev-server':
      return 'dev';
    case 'stage':
    case 'stage-server':
      return 'stage';
    default:
      return 'prod';
  }
}
