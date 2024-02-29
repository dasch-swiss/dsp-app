# How to Contribute to this Project

<!-- TODO: the following section is moved from the main README and has to be updated -->
## Development server

DSP-APP is built with [Angular](https://angular.io/) and uses [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

You have to install the corresponding packages with `npm i`. Now you have to possibilites to run the application in developer mode:

- With a local installed [DSP-API environment](https://docs.dasch.swiss/latest/developers/getting-started/) run `ng serve` or `npm run start`.
- If you want to connect to the DSP-API on our test server run `ng serve --configuration=test-server` or `npm run start-with-test-server`. Please consider which version of DSP-API is currently running on the test server (see webapi: <https://api.test.dasch.swiss/version>). With this solution you will also have access to all the representation files.

In both case navigate to `http://0.0.0.0:4200/`. The app will automatically reload if you change any of the resource files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can
also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the app. The build artifacts will be stored in the `dist/` directory. Run the command `npm run build-prod` for a production build.

## Test

The following tests (unit, e2e and lint) are part of the Github Actions (CI) workflow and has to be run successfully before the code can be merged into the main branch.

### Running unit tests

Run `npm run test-local` to execute the unit tests via [Karma](https://karma-runner.github.io) on your local computer.

Run `npm run test-ci` to execute the unit tests via [Karma](https://karma-runner.github.io) without a browser. It is used in the Github Actions (CI) workflow.

### Running end-to-end tests

Run `npm run test-e2e-protractor` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

### Running code linter

Run `npm run lint-local` to execute the lint service via [ESLint](https://eslint.org). This command uses the `--fix` flag which fixes simple errors like redundant type if you have default value assigned. In the Github Actions (CI) workflow the linter runs as `npm run lint-ci`.

To integrate ESLint with Visual Studio Code, do the following:

- Install the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extension.
- Create a task via the **Tasks: Configure Task** command and select `npm: lint-local`.
- In the resulting `tasks.json` file, configure the problem matcher to be `$eslint-stylish`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
