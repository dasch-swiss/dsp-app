import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { CalendarMarkerComponent } from './calendar-marker.component';

describe('CalendarMarkerComponent', () => {
  let fixture: ComponentFixture<CalendarMarkerComponent>;
  let component: CalendarMarkerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarMarkerComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarMarkerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('storedCalendar', 'JULIAN');
    fixture.componentRef.setInput('availableCalendars', ['GREGORIAN', 'JULIAN', 'ISLAMIC']);
    fixture.detectChanges();
  });

  // `protected` members are reachable at runtime; the modifier only shapes the template's API.
  const asAny = () => component as any;

  it('reports the stored calendar until the reader picks another', () => {
    expect(asAny().displayCalendar()).toBe('JULIAN');
    expect(asAny().isConverted()).toBe(false);
  });

  it('reports the chosen calendar once picked, and says it is converted', () => {
    asAny().selectCalendar('GREGORIAN');

    expect(asAny().displayCalendar()).toBe('GREGORIAN');
    expect(asAny().isConverted()).toBe(true);
  });

  it('emits the chosen calendar so the owner can re-render', () => {
    const emitted: string[] = [];
    component.displayCalendarChange.subscribe(calendar => emitted.push(calendar));

    asAny().selectCalendar('ISLAMIC');

    expect(emitted).toEqual(['ISLAMIC']);
  });

  it("never modifies the stored calendar, which is the reader's anchor", () => {
    asAny().selectCalendar('GREGORIAN');

    expect(component.storedCalendar()).toBe('JULIAN');
  });

  it('refuses a calendar the value cannot be represented in', () => {
    fixture.componentRef.setInput('availableCalendars', ['GREGORIAN', 'JULIAN']);
    const emitted: string[] = [];
    component.displayCalendarChange.subscribe(calendar => emitted.push(calendar));

    asAny().selectCalendar('ISLAMIC');

    expect(asAny().displayCalendar()).toBe('JULIAN');
    expect(emitted).toEqual([]);
  });

  it('always allows the stored calendar, whatever the availability list says', () => {
    fixture.componentRef.setInput('availableCalendars', []);

    expect(asAny().isAvailable('JULIAN')).toBe(true);
    expect(asAny().isAvailable('GREGORIAN')).toBe(false);
  });

  describe('accessible name', () => {
    it('states the stored calendar at rest', () => {
      expect(asAny().accessibleLabel()).toBe('Calendar: JULIAN');
    });

    it('names both calendars once converted, matching what a sighted reader sees', () => {
      asAny().selectCalendar('GREGORIAN');

      expect(asAny().accessibleLabel()).toBe('Calendar: GREGORIAN, stored as JULIAN');
    });
  });

  // A plain @Input would be captured once by computed() and then go stale. Signal inputs are what
  // make this pass; it fails if anyone converts them back.
  it('reflects a new storedCalendar on a reused instance, rather than going stale', () => {
    expect(asAny().displayCalendar()).toBe('JULIAN');

    fixture.componentRef.setInput('storedCalendar', 'GREGORIAN');
    fixture.detectChanges();

    expect(asAny().displayCalendar()).toBe('GREGORIAN');
  });
});
