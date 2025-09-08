# DSP-DAS Performance Testing

This repository contains performance tests for the DSP-DAS project.
To run the tests, you need to install [k6](https://k6.io/).

Use brew to install it:

```sh
brew install k6
```

The test are based on the [k6 browser module](https://k6.io/docs/using-k6-browser/overview/) which brings browser automation and end-to-end web testing to k6 while supporting [core k6 features](https://k6.io/docs/using-k6/http-requests/).

## Running the tests

You can run the tests using the following command:

```sh
k6 run tests/<test_script.js>
```

### Tests Which Require Authentication

Tests that require authentication need to be run with the correct environment variables set.

For example locally you can store the credentials in a `.env` file:

```sh
export DSP_APP_USERNAME='admin'
export DSP_APP_PASSWORD='password'
```

Before running the tests you can source the file:

```sh
source .env
```

Then you can run the test as described above.

### Using `just`

We provide a `justfile` to make it easier to run the tests.
If you don't have [`just`](https://just.systems/man/en/) installed, you can install it using brew:

```sh
brew install just
```

Listing all the available tests:

```sh
just list
```

You can run the tests _locally_ using the following command:

```sh
just run <test_name>
```

### Flexible Environment Testing

Run tests against any environment using the `env` parameter:

```sh
# Run against specific environments
just run <test_name> dev      # DEV environment (default)
just run <test_name> dev02    # DEV-02 environment  
just run <test_name> stage    # STAGE environment
just run <test_name> prod     # PRODUCTION environment

# Use custom URLs
just run <test_name> "https://my-custom-url.com"

# List available environments
just environments
```

### Environment Comparison

Compare performance between any two environments:

```sh
# Flexible comparison (default: stage vs dev02)
just compare <test_name>                    # STAGE vs DEV-02
just compare <test_name> dev stage          # DEV vs STAGE
just compare <test_name> prod dev02         # PROD vs DEV-02

# Convenience aliases
just compare-stage-dev02 <test_name>        # Quick STAGE vs DEV-02
just compare-dev-stage <test_name>          # Quick DEV vs STAGE
```

Environment URLs are defined in the `justfile` and fallback to constants in `options/constants.js`.

You can run the tests _in the [k6 cloud](https://k6.io/docs/cloud/)_ using the following command:

```sh
just run-cloud <test_name>
```

For running in the cloud you [need to login](https://k6.io/docs/cloud/creating-and-running-a-test/cloud-tests-from-the-cli/#run-test-on-the-cli).

## Developing the tests locally without k6 cloud

This setup contains a `docker-compose.yml` file that allows you to run the tests locally without having to install Grafana. You can run the tests and export its metrics to the local Grafana instance.

All tests are found in the `./tests` folder.
The folder `./options` contains common [options](https://k6.io/docs/using-k6/k6-options/) for running the test, e.g. number of VU, certain [scenarios](https://k6.io/docs/using-k6/scenarios/) and such.
The folder `./pages` contains [page objects](https://martinfowler.com/bliki/PageObject.html) modelling reusable pages for use in the tests.

### Setting up the environment

Start Grafana with InfluxDB instances:

```sh
just grafana-up
```

#### Create a Dashboard for Browser Tests

This will open up the create dashboard page in the browser and copy the `grafana_dashboard.json` to your clipboard. On this page you have to "import a dashboard" and paste the json and save.

Stopping the Grafana stack is done with:

```sh
just grafana-down
```

[IMPORTANT] The Grafana setup is not persistent. If you stop the containers, the data will be lost and you will have to recreate the dashboard with the steps above.

#### Create a Dashboard for HTTP Tests

Grafana provides some [preconfigured dashboards](https://grafana.com/grafana/dashboards/?search=k6), unfortunately they do not provide one for the browser metrics.
If you are using `k6`'s `http` for testing API you might want to import the [nr `2587` "k6 Load Testing Results"](https://grafana.com/grafana/dashboards/2587-k6-load-testing-results/) dashboard.

### Visualizing the test results in Grafana

When running the tests you have to instruct k6 to export the metrics to the Grafana instance. You can do this by setting the `K6_OUT` environment variable to the url of the InfluxDB instance.

We have a `just` command that sets this variable for you:

```sh
just run-grafana <test_name>
```

## State Performance Tests

### Test Types

| Test | Duration | Purpose | Command |
|------|----------|---------|---------|
| `state-quick` | 2-4 min | Fast state validation (CI/CD) | `just state-quick` |
| `state-performance` | 5-10 min | Deep state analysis (pre-deploy) | `just state-performance` |
| `ui-performance` | 30s | UI interaction benchmarks | `just ui-performance` |
| `state-stats` | 8-12 min | Statistical validation | `just state-stats` |

### Environment-Aware Thresholds

| Environment | Bootstrap | Memory Growth | State Updates | Success Rate |
|-------------|-----------|---------------|---------------|--------------|
| **DEV** | < 20s | < 60MB | < 800ms | > 50% |
| **STAGE** | < 15s | < 50MB | < 600ms | > 60% |
| **PROD** | < 12s | < 40MB | < 500ms | > 70% |

### Usage

**Compare environments:**
```bash
just state-compare stage dev02    # STAGE vs DEV-02
just state-quick dev02            # Auto-detects environment thresholds
```

**CI/CD integration:**
```bash
just state-quick && echo "✅ Performance OK" || echo "❌ Performance issues detected"
```

## User Service Performance Tests

Compare NGXS → UserService performance impact with K6 browser tests + Cypress frontend tests.

### K6 Tests

| Test | Purpose | Command |
|------|---------|---------|
| `login-performance` | Auth flow timing + API requests | `just login-performance stage` |
| `login-propagation` | Cross-page state updates + API analysis | `just login-propagation dev` |

**Compare environments:**
```bash
just login-compare stage dev    # Compare login performance
# Results include: login_duration, auth_flow_success, api_auth_requests, api_total_requests
```

**API Request Metrics:** Tests now track authentication, project, ontology, and resource API calls to detect request pattern changes.

### Cypress Tests

| Test | Purpose |
|------|---------|
| `change-detection-cycles.cy.ts` | Angular change detection + memory |
| `memory-leak-detection.cy.ts` | Subscription cleanup + leaks |

**Usage:**
```bash
# Local
npm run e2e-ci -- --spec="cypress/e2e/performance/**/*.cy.ts" --env VERSION=ngxs

# Remote (DEV/STAGE)
export DSP_APP_USERNAME='username' DSP_APP_PASSWORD='password'
cd apps/dsp-app && npx cypress run \
  --spec "cypress/e2e/performance/**/*.cy.ts" \
  --config baseUrl=https://app.dev.dasch.swiss \
  --env VERSION=dev,skipDatabaseCleanup=true,apiUrl=https://api.dev.dasch.swiss,DSP_APP_USERNAME=$DSP_APP_USERNAME,DSP_APP_PASSWORD=$DSP_APP_PASSWORD
```

## More to read

- [k6: Types of Load Testing](https://grafana.com/load-testing/types-of-load-testing/)
- [k6: Official Tutorial](https://k6.io/docs/examples/tutorials/get-started-with-k6/)
- [k6: More resources](https://k6.io/docs/get-started/resources/)
- [GitHub: k6-learn, a nice Tutorial](https://github.com/grafana/k6-learn/blob/main/Modules/II-k6-Foundations/01-Getting-started-with-k6-OSS.md)
- [youtube: Nice introduction to k6 (Grafana setup comes from here)](https://www.youtube.com/watch?v=Hu1K2ZGJ_K4)
- [Google: Web Vitals](https://web.dev/vitals/)
