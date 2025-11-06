import { InjectionToken } from '@angular/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BehaviorSubject } from 'rxjs';

export const ACTIVE_CALENDAR = new InjectionToken<BehaviorSubject<'Gregorian' | 'Julian' | 'Islamic'>>(
  'Active Calendar'
);
