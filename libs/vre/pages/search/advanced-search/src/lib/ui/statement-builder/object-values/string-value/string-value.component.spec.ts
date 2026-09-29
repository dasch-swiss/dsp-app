import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Constants, KnoraDate } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';

import { StringValueComponent } from './string-value.component';

/**
 * A date search term is sent in the calendar the user chose, unconverted (DEV-7372).
 *
 * The gravsearch literal carries its own calendar — "JULIAN:2024-06-02 CE" — and dsp-api compares
 * dates across calendars server-side through knora-api:toSimpleDate(). Converting here would be
 * redundant work that also discards the calendar the user actually stated.
 */
describe('StringValueComponent date operand', () => {
  let fixture: ComponentFixture<StringValueComponent>;
  let component: StringValueComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StringValueComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    })
      .overrideComponent(StringValueComponent, { set: { template: '<div>Mock</div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(StringValueComponent);
    component = fixture.componentInstance;
    component.valueType = Constants.DateValue;
    fixture.detectChanges();
  });

  /**
   * Collects what the component emits. `onDateSelected` writes to the input control, which emits
   * through a 300ms debounce, so a caller must advance time past it.
   */
  const emitted = (): string[] => {
    const seen: string[] = [];
    component.emitValueChanged.subscribe(value => seen.push(value));
    return seen;
  };

  const settle = () => tick(300);

  it('sends a Gregorian term tagged Gregorian', fakeAsync(() => {
    const seen = emitted();

    component.onDateSelected(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
    settle();

    expect(seen).toEqual(['GREGORIAN:2024-06-15']);
  }));

  it('sends a Julian term tagged Julian, not silently converted to Gregorian', fakeAsync(() => {
    // dsp-api compares across calendars server-side, so the term keeps the calendar the user chose.
    const seen = emitted();

    component.onDateSelected(new KnoraDate('JULIAN', 'CE', 2024, 6, 2));
    settle();

    expect(seen).toEqual(['JULIAN:2024-06-02']);
  }));

  it('sends an Islamic term tagged Islamic', fakeAsync(() => {
    const seen = emitted();

    component.onDateSelected(new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8));
    settle();

    expect(seen).toEqual(['ISLAMIC:1445-12-08']);
  }));

  it('carries the era through untouched', fakeAsync(() => {
    const seen = emitted();

    component.onDateSelected(new KnoraDate('JULIAN', 'BCE', 44, 3, 15));
    settle();

    expect(seen).toEqual(['JULIAN:44-03-15 BCE']);
  }));

  it('sends a year-precision term without inventing a month or day', fakeAsync(() => {
    const seen = emitted();

    component.onDateSelected(new KnoraDate('JULIAN', 'CE', 1582));
    settle();

    expect(seen).toEqual(['JULIAN:1582']);
  }));

  it('keeps the calendar name bare, never the translated display name', fakeAsync(() => {
    // The single most dangerous thing this component could get wrong: dsp-api parses this literal,
    // so a human-readable calendar name here breaks every date query in the app.
    const seen = emitted();

    component.onDateSelected(new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8));
    settle();

    expect(seen[0]).toContain('ISLAMIC:');
    expect(seen[0]).not.toMatch(/tabular|Islamic \(/);
  }));

  it('does not leave a stale term behind when the date is cleared', fakeAsync(() => {
    component.onDateSelected(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
    settle();
    const seen = emitted();

    component.onDateSelected(null);
    settle();

    // Whatever reaches the stream, the term itself must not still be the old date.
    expect(seen).not.toContain('GREGORIAN:2024-06-15');
  }));

  describe('choosing a calendar for the term', () => {
    it('converts the entered date into the chosen calendar', fakeAsync(() => {
      component.onDateSelected(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1));
      settle();
      const seen = emitted();

      component.onCalendarSelected('JULIAN');
      settle();

      // Converted, not relabelled: 01.04 Gregorian is 19.03 Julian.
      expect(seen).toEqual(['JULIAN:2020-03-19']);
    }));

    it('records the chosen calendar so the picker is told it', fakeAsync(() => {
      component.onCalendarSelected('ISLAMIC');
      settle();

      expect(component.searchCalendar()).toBe('ISLAMIC');
    }));
  });

  describe('reading a stored term back into the picker', () => {
    it('restores the calendar the term was written in', () => {
      const date = component._transformDateStringToKnoraDateObject('JULIAN:2024-06-02 CE');

      expect(date.calendar).toBe('JULIAN');
      expect(date.year).toBe(2024);
      expect(date.month).toBe(6);
      expect(date.day).toBe(2);
    });

    it('restores an Islamic term', () => {
      const date = component._transformDateStringToKnoraDateObject('ISLAMIC:1445-12-08');

      expect(date.calendar).toBe('ISLAMIC');
      expect(date.year).toBe(1445);
    });

    it('restores a BCE term with its era', () => {
      const date = component._transformDateStringToKnoraDateObject('JULIAN:44-03-15 BCE');

      expect(date.era).toBe('BCE');
      expect(date.year).toBe(44);
    });

    it('round-trips a term through the picker and back to the same string', () => {
      // The picker owns the gravsearch formatting, so this pins the pair rather than one half:
      // a term read in and written out again must name the same day in the same calendar.
      const original = 'JULIAN:2024-06-02 BCE';
      const date = component._transformDateStringToKnoraDateObject(original);

      expect(date).toBeInstanceOf(KnoraDate);
      expect(`${date.calendar}:${date.year}-${date.month}-${date.day} ${date.era}`).toBe('JULIAN:2024-6-2 BCE');
    });
  });
});
