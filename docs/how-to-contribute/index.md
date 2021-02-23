# How to Contribute to this Project

<!-- TODO: the following section is moved from the main README and has to be updated -->
## Development server

Run `ng serve` or `npm run start` for a dev server. Navigate to `http://0.0.0.0:4200/`. The app will automatically reload if you change any of the resource files.

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

Run `npm run lint` to execute the lint service via [tslint](https://palantir.github.io/tslint/).

> :warning: **tslint is deprecated and will be replaced by eslint**
> 
> Get more info here: <https://dasch.myjetbrains.com/youtrack/issue/DSP-1260>

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
