export const smokeTest = {
  // a small test that checks for major issues before spending more time and resources
  executor: 'shared-iterations',
  tags: { type: 'smoke-test' },
  vus: 1,
  iterations: 5,
  maxDuration: '10s',

  options: {
    browser: {
      type: 'chromium',
    },
  },
};

export const averageLoad = {
  startTime: '10s',
  executor: 'ramping-vus',
  tags: { type: 'average-load' },
  startVUs: 0,
  stages: [
    { duration: '20s', target: 9 },
    { duration: '10s', target: 0 },
  ],
  gracefulRampDown: '0s',
  options: {
    browser: {
      type: 'chromium',
    },
  },
};

export const defaultScenario = {
  smokeTest: smokeTest,
  averageLoad: averageLoad,
};

export const defaultOptions = {
  cloud: {
    distribution: {
      distributionLabel1: { loadZone: 'amazon:de:frankfurt', percent: 100 },
    },
  },
  scenarios: defaultScenario,
};
