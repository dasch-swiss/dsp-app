/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// eslint-disable-next-line import/no-extraneous-dependencies
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: false },
  }
);
