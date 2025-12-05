/**
 * Unit tests for provideCalendarDateAdapter.
 */

import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideCalendarDateAdapter } from './calendar-date-adapter.providers';
import { CALENDAR_DATE_FORMATS } from './calendar-date-formats';
import { CalendarDateAdapter } from './calendar-date.adapter';

describe('provideCalendarDateAdapter', () => {
  it('should return an array of providers', () => {
    const providers = provideCalendarDateAdapter();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBe(2);
  });

  it('should provide DateAdapter with CalendarDateAdapter', () => {
    const providers = provideCalendarDateAdapter();
    const dateAdapterProvider = providers.find(p => (p as any).provide === DateAdapter);

    expect(dateAdapterProvider).toBeDefined();
    expect((dateAdapterProvider as any).useClass).toBe(CalendarDateAdapter);
  });

  it('should provide MAT_DATE_FORMATS with CALENDAR_DATE_FORMATS', () => {
    const providers = provideCalendarDateAdapter();
    const formatsProvider = providers.find(p => (p as any).provide === MAT_DATE_FORMATS);

    expect(formatsProvider).toBeDefined();
    expect((formatsProvider as any).useValue).toBe(CALENDAR_DATE_FORMATS);
  });

  it('should include DateAdapter provider at first position', () => {
    const providers = provideCalendarDateAdapter();
    expect((providers[0] as any).provide).toBe(DateAdapter);
  });

  it('should include MAT_DATE_FORMATS provider at second position', () => {
    const providers = provideCalendarDateAdapter();
    expect((providers[1] as any).provide).toBe(MAT_DATE_FORMATS);
  });

  it('should return providers that can be spread into a providers array', () => {
    const providers = provideCalendarDateAdapter();
    const testProviders = [...providers];

    expect(testProviders.length).toBe(2);
    expect((testProviders[0] as any).provide).toBe(DateAdapter);
    expect((testProviders[1] as any).provide).toBe(MAT_DATE_FORMATS);
  });

  it('should provide DateAdapter with correct dependencies', () => {
    const providers = provideCalendarDateAdapter();
    const dateAdapterProvider = providers[0] as any;

    expect(dateAdapterProvider.deps).toBeDefined();
    expect(Array.isArray(dateAdapterProvider.deps)).toBe(true);
  });
});
