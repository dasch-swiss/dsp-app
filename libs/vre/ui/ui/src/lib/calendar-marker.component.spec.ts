import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { CalendarMarkerComponent, CalendarReading } from './calendar-marker.component';

describe('CalendarMarkerComponent', () => {
  let fixture: ComponentFixture<CalendarMarkerComponent>;
  let component: CalendarMarkerComponent;

  const READINGS: CalendarReading[] = [
    { calendar: 'GREGORIAN', date: '12.06.1582' },
    { calendar: 'JULIAN', date: '02.06.1582' },
    { calendar: 'ISLAMIC', date: '20.09.990' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarMarkerComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarMarkerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('storedCalendar', 'JULIAN');
    fixture.componentRef.setInput('readings', READINGS);
    fixture.detectChanges();
  });

  // `protected` members exist at runtime; the modifier only shapes the template's API.
  const asAny = () => component as any;

  it('names the stored calendar at rest', () => {
    expect(asAny().storedLabel()).toBe('ui.calendarMarker.calendars.JULIAN');
  });

  it('starts closed', () => {
    expect(asAny().isOpen()).toBe(false);
  });

  it('opens and closes on the trigger', () => {
    asAny().toggle();
    expect(asAny().isOpen()).toBe(true);

    asAny().toggle();
    expect(asAny().isOpen()).toBe(false);
  });

  it('closes on Escape', () => {
    asAny().toggle();

    asAny().onOverlayKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(asAny().isOpen()).toBe(false);
  });

  it('ignores other keys', () => {
    asAny().toggle();

    asAny().onOverlayKeydown(new KeyboardEvent('keydown', { key: 'a' }));

    expect(asAny().isOpen()).toBe(true);
  });

  describe('the listing', () => {
    it('puts the stored calendar first, whatever order the owner supplied', () => {
      expect(asAny().ordered()[0].calendar).toBe('JULIAN');
    });

    it('lists every calendar, including ones this value cannot be expressed in', () => {
      // A row with no date says "Before the Hijra" rather than disappearing, so a reader can tell
      // "no such date" from "not shown".
      fixture.componentRef.setInput('readings', [
        { calendar: 'GREGORIAN', date: '01.01.0500' },
        { calendar: 'JULIAN', date: '01.01.0500' },
        { calendar: 'ISLAMIC' },
      ]);
      fixture.detectChanges();

      expect(asAny().ordered().length).toBe(3);
      expect(
        asAny()
          .ordered()
          .find((r: CalendarReading) => r.calendar === 'ISLAMIC')?.date
      ).toBeUndefined();
    });

    // The reform's skipped days are valid proleptic dates, and the panel says what they are.
    it('states the note for a day the Gregorian reform skipped', () => {
      fixture.componentRef.setInput('facts', {
        reformGap: { date: '05.10.1582 Gregorian', julian: '25.09.1582 Julian' },
      });
      fixture.detectChanges();
      asAny().toggle();
      fixture.detectChanges();

      const note = document.querySelector('[data-cy="calendar-marker-reform-gap"]');
      expect(note?.textContent).toContain('reformGapNote');
    });

    it('does not mutate the readings it was given', () => {
      const order = READINGS.map(r => r.calendar);

      asAny().ordered();

      expect(READINGS.map(r => r.calendar)).toEqual(order);
    });
  });

  // A plain @Input would be captured once by computed() and then go stale. Signal inputs are what
  // make these pass; they fail if anyone converts them back.
  describe('reacting to input changes on a reused instance', () => {
    it('reflects a new stored calendar', () => {
      fixture.componentRef.setInput('storedCalendar', 'GREGORIAN');
      fixture.detectChanges();

      expect(asAny().storedLabel()).toBe('ui.calendarMarker.calendars.GREGORIAN');
      expect(asAny().ordered()[0].calendar).toBe('GREGORIAN');
    });

    it('reflects new readings', () => {
      fixture.componentRef.setInput('readings', [{ calendar: 'JULIAN', date: '09.09.1999' }]);
      fixture.detectChanges();

      expect(asAny().ordered()[0].date).toBe('09.09.1999');
    });
  });
  describe('naming which Islamic calendar (DEV-7372)', () => {
    // There are several normative Islamic calendars and they disagree by a day or two. The app
    // implements the tabular one; a bare "Islamic" would present it as *the* Islamic date, which
    // for historical material is a claim the app cannot back (DEV-7429).

    it('names the scheme through the same key as every other calendar', () => {
      // The marker renders `ui.calendarMarker.calendars.<CALENDAR>`, so naming the scheme in that
      // one key reaches the trigger and every reading row at once — including for a value the
      // reader never chose, which is the case that matters most.
      fixture.componentRef.setInput('storedCalendar', 'ISLAMIC');
      fixture.componentRef.setInput('readings', [{ calendar: 'ISLAMIC', date: '08.12.1445' }]);
      fixture.detectChanges();

      expect((component as any).storedLabel()).toBe('ui.calendarMarker.calendars.ISLAMIC');
    });
  });
});
