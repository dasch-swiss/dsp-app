import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KnoraDate, KnoraPeriod, ReadDateValue } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';

import { DateViewerComponent } from './date-viewer.component';

const asValue = (date: KnoraDate | KnoraPeriod): ReadDateValue => ({ date }) as unknown as ReadDateValue;

describe('DateViewerComponent', () => {
  let fixture: ComponentFixture<DateViewerComponent>;
  let component: DateViewerComponent;

  const mount = (value: ReadDateValue) => {
    fixture = TestBed.createComponent(DateViewerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return fixture;
  };

  // `protected` members exist at runtime; the modifier only shapes the template's API.
  const asAny = () => component as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateViewerComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    }).compileComponents();
  });

  it('renders a date in its stored calendar', () => {
    mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

    expect(asAny().displayText()).toBe('15.06.2024');
    expect(asAny().storedCalendar()).toBe('GREGORIAN');
  });

  it('renders both ends of a period', () => {
    mount(
      asValue(
        new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2020, 1, 1), new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31))
      )
    );

    expect(asAny().displayText()).toBe('01.01.2020 - 31.12.2024');
  });

  it('takes a period’s calendar from its start, since a period carries one calendar', () => {
    mount(
      asValue(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2020, 1, 1), new KnoraDate('JULIAN', 'CE', 2024, 12, 31)))
    );

    expect(asAny().storedCalendar()).toBe('JULIAN');
  });

  describe('showing the value in another calendar', () => {
    it('re-renders the date in the chosen calendar', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      asAny().displayCalendar.set('JULIAN');

      expect(asAny().displayText()).toBe('02.06.2024');
    });

    it('converts both ends of a period together', () => {
      mount(
        asValue(
          new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), new KnoraDate('GREGORIAN', 'CE', 2024, 7, 15))
        )
      );

      asAny().displayCalendar.set('JULIAN');

      expect(asAny().displayText()).toBe('02.06.2024 - 02.07.2024');
    });

    it('shows the span a year-precision date covers rather than one year', () => {
      mount(asValue(new KnoraDate('JULIAN', 'CE', 1582)));

      asAny().displayCalendar.set('GREGORIAN');

      expect(asAny().displayText()).toBe('1582/1583');
    });

    it('never renders a day for a year-precision value', () => {
      mount(asValue(new KnoraDate('JULIAN', 'CE', 1582)));

      asAny().displayCalendar.set('GREGORIAN');

      expect(asAny().displayText()).not.toMatch(/\d{2}\.\d{2}\./);
    });

    it('leaves the stored value untouched, so the choice is a lens and not an edit', () => {
      const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      mount(asValue(date));

      asAny().displayCalendar.set('JULIAN');

      expect(date.calendar).toBe('GREGORIAN');
      expect(date.day).toBe(15);
      expect(component.value().date).toBe(date);
    });
  });

  describe('which calendars are offered', () => {
    it('offers all three for a modern date', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      expect(asAny().availableCalendars()).toEqual(['GREGORIAN', 'JULIAN', 'ISLAMIC']);
    });

    it('withholds the Islamic calendar from a pre-Hijra date', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1)));

      expect(asAny().availableCalendars()).toEqual(['GREGORIAN', 'JULIAN']);
    });

    it('withholds a calendar a period cannot be shown in end to end', () => {
      mount(
        asValue(
          new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1), new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15))
        )
      );

      expect(asAny().availableCalendars()).toEqual(['GREGORIAN', 'JULIAN']);
    });
  });

  describe('the choice is ephemeral', () => {
    // The workspace sets no RouteReuseStrategy, so Angular destroys and recreates this component
    // on reload and on navigating away and back. Recreating it is therefore the faithful test.
    it('returns to the stored calendar when the component is rebuilt', () => {
      const value = asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
      mount(value);
      asAny().displayCalendar.set('JULIAN');
      expect(asAny().displayText()).toBe('02.06.2024');

      fixture.destroy();
      mount(value);

      expect(asAny().displayText()).toBe('15.06.2024');
    });

    it('keeps one viewer’s choice out of another’s', () => {
      const first = mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));
      const firstComponent = first.componentInstance as any;
      firstComponent.displayCalendar.set('JULIAN');

      const second = TestBed.createComponent(DateViewerComponent);
      second.componentRef.setInput('value', asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));
      second.detectChanges();

      expect((second.componentInstance as any).displayText()).toBe('15.06.2024');
      expect(firstComponent.displayText()).toBe('02.06.2024');
    });
  });

  it('renders with no authenticated user, since the resource view is public', () => {
    // Nothing here injects a session service; this pins that, because a later dependency on one
    // would break the view for anonymous readers without failing any other test.
    expect(() => mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)))).not.toThrow();
    expect(asAny().displayText()).toBe('15.06.2024');
  });

  // A plain @Input would be captured once by computed() and then go stale. Signal inputs are what
  // make this pass; it fails if anyone converts them back.
  it('re-renders when the value input changes on a reused instance', () => {
    mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));
    expect(asAny().displayText()).toBe('15.06.2024');

    fixture.componentRef.setInput('value', asValue(new KnoraDate('JULIAN', 'CE', 1999, 1, 2)));
    fixture.detectChanges();

    expect(asAny().displayText()).toBe('02.01.1999');
    expect(asAny().storedCalendar()).toBe('JULIAN');
  });
});
