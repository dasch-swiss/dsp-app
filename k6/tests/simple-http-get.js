import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';

export const ErrorCount = new Counter('errors');

export const options = {
  // A number specifying the number of VUs to run concurrently.
  vus: 10,
  // A string specifying the total duration of the test run.
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
};

// The function that defines VU logic.
//
// See https://grafana.com/docs/k6/latest/examples/get-started-with-k6/ to learn more
// about authoring k6 scripts.
//
export default function () {
  const path = Math.random() < 0.9 ? '200' : '500';
  let res = http.get(`https://httpstat.us/${path}`);
  //const res = http.get('https://ingest.dev.dasch.swiss/info');
  const success = check(res, { status: res => res.status === 200 });
  if (!success) {
    ErrorCount.add(1);
  }
  sleep(1);
}
