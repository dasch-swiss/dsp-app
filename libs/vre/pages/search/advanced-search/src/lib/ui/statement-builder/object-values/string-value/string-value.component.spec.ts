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

    component.onDateSelected('GREGORIAN:2024-06-15');
    settle();

    expect(seen).toEqual(['GREGORIAN:2024-06-15']);
  }));

  it('sends a Julian term tagged Julian, not silently converted to Gregorian', fakeAsync(() => {
    const seen = emitted();

    component.onDateSelected('JULIAN:2024-06-02');
    settle();

    expect(seen).toEqual(['JULIAN:2024-06-02']);
  }));

  it('sends an Islamic term tagged Islamic', fakeAsync(() => {
    const seen = emitted();

    component.onDateSelected('ISLAMIC:1445-12-08');
    settle();

    expect(seen).toEqual(['ISLAMIC:1445-12-08']);
  }));

  it('carries the era through untouched', fakeAsync(() => {
    const seen = emitted();

    component.onDateSelected('JULIAN:0044-03-15 BCE');
    settle();

    expect(seen).toEqual(['JULIAN:0044-03-15 BCE']);
  }));

  it('passes the term through unaltered, so no conversion happens on this side', fakeAsync(() => {
    const seen = emitted();
    const term = 'JULIAN:1582-10-04';

    component.onDateSelected(term);
    settle();

    expect(seen[0]).toBe(term);
  }));

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
