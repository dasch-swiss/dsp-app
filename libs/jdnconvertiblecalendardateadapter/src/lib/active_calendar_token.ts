/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const ACTIVE_CALENDAR = new InjectionToken<
  BehaviorSubject<'Gregorian' | 'Julian' | 'Islamic'>
>('Active Calendar');
