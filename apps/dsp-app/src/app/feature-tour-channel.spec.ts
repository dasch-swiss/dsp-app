import { featureTourChannel } from './feature-tour-channel';

describe('featureTourChannel', () => {
  it.each([
    ['dev', 'dev'],
    ['local-dev', 'dev'],
    ['dev-server', 'dev'],
    ['stage', 'stage'],
    ['stage-server', 'stage'],
    ['prod', 'prod'],
    ['production', 'prod'],
    ['demo', 'prod'],
    ['ls-test-server', 'prod'],
  ])('maps %s to %s', (environment, channel) => {
    expect(featureTourChannel(environment)).toBe(channel);
  });
});
