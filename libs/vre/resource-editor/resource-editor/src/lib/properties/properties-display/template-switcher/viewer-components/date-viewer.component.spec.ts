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
  const reading = (calendar: string) =>
    asAny()
      .readings()
      .find((r: { calendar: string }) => r.calendar === calendar);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateViewerComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    }).compileComponents();
  });

  it('renders the date in the calendar it is stored in', () => {
    mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

    expect(asAny().storedText()).toBe('15.06.2024');
    expect(asAny().storedCalendar()).toBe('GREGORIAN');
  });

  it('renders both ends of a period', () => {
    mount(
      asValue(
        new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2020, 1, 1), new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31))
      )
    );

    expect(asAny().storedText()).toBe('01.01.2020 - 31.12.2024');
  });

  it('takes a period\u2019s calendar from its start, since a period carries one calendar', () => {
    mount(
      asValue(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2020, 1, 1), new KnoraDate('JULIAN', 'CE', 2024, 12, 31)))
    );

    expect(asAny().storedCalendar()).toBe('JULIAN');
  });

  describe('reading the value in every calendar', () => {
    it('offers one reading per calendar', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      expect(asAny().readings().length).toBe(3);
    });

    it('reads the same day in each', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      expect(reading('GREGORIAN').date).toBe('15.06.2024');
      expect(reading('JULIAN').date).toBe('02.06.2024');
      expect(reading('ISLAMIC').date).toBe('08.12.1445');
    });

    it('reads a period end to end in each calendar', () => {
      mount(
        asValue(
          new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), new KnoraDate('GREGORIAN', 'CE', 2024, 7, 15))
        )
      );

      expect(reading('JULIAN').date).toBe('02.06.2024 - 02.07.2024');
    });

    it('leaves a calendar without a date where the value cannot be expressed in it', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1)));

      expect(reading('ISLAMIC').date).toBeUndefined();
      expect(reading('JULIAN').date).toBeDefined();
    });
  });

  describe('the rendered date never changes', () => {
    // The whole point of comparing rather than switching: what is on the page is always the stored
    // date, so a reader cannot lose track of what the source said. An earlier version re-rendered
    // the value in a chosen calendar, and a story asserted exactly that.
    it('shows the stored date whatever the other calendars say', () => {
      const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      mount(asValue(date));

      expect(asAny().storedText()).toBe('15.06.2024');
      expect(asAny().storedText()).not.toBe(reading('JULIAN').date);
    });

    it('leaves the stored value untouched', () => {
      const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      mount(asValue(date));

      asAny().readings();

      expect(date.calendar).toBe('GREGORIAN');
      expect(date.day).toBe(15);
      expect(component.value().date).toBe(date);
    });
  });

  describe('spans', () => {
    it('reads a year-precision date as the span it covers', () => {
      mount(asValue(new KnoraDate('JULIAN', 'CE', 1582)));

      expect(reading('GREGORIAN').date).toBe('1582/1583');
    });

    it('never states a day for a year-precision value', () => {
      mount(asValue(new KnoraDate('JULIAN', 'CE', 1582)));

      expect(reading('GREGORIAN').date).not.toMatch(/\d{2}\.\d{2}\./);
    });
  });

  describe('era', () => {
    // Era where it carries information: "450" alone is ambiguous in a corpus holding BCE material,
    // "2024 CE" is noise.
    it('states the era for a BCE date', () => {
      mount(asValue(new KnoraDate('JULIAN', 'BCE', 44, 3, 15)));

      expect(asAny().storedText()).toContain('BCE');
    });

    it('states the era for a CE year below 1000', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 450, 6, 1)));

      expect(asAny().storedText()).toBe('01.06.450 CE');
    });

    it('omits the era for a modern CE year', () => {
      mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      expect(asAny().storedText()).toBe('15.06.2024');
    });

    it('never states an era for an Islamic date', () => {
      mount(asValue(new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8)));

      expect(asAny().storedText()).toBe('08.12.1445');
    });

    it('states a shared era once across a span, not on both ends', () => {
      mount(asValue(new KnoraDate('JULIAN', 'BCE', 754)));

      const gregorian = reading('GREGORIAN').date;
      expect(gregorian.match(/BCE/g)?.length ?? 0).toBe(1);
    });
  });

  it('renders with no authenticated user, since the resource view is public', () => {
    // Nothing here injects a session service; this pins that, because a later dependency on one
    // would break the view for anonymous readers without failing any other test.
    expect(() => mount(asValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)))).not.toThrow();
  });
});
