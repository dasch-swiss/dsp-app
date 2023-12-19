/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { BuildTag } from './build-tag';

/**
 * The BuildTagToken is used to encapsulate build_tag
 * loaded from 'config/build.json' loaded in main.ts before bootstrap.
 * As such, the structure of the loaded JSON is at this point not checked.
 */
export const BuildTagToken = new InjectionToken<Observable<BuildTag>>('A stream with the current build tag');
