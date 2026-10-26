import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Constants, KnoraDate } from '@dasch-swiss/dsp-js';
import { CalendarDateService } from '@dasch-swiss/vre/ui/ui';
import { provideTranslateService, TranslateModule } from '@ngx-translate/core';
import { ResourceLabel } from '../../../../constants';
import { Operator } from '../../../../operators.config';
import { StringValueComponent } from './string-value.component';
describe('StringValueComponent "is like" pattern (DEV-7441)', () => {
  let fixture: ComponentFixture<StringValueComponent>;
  let component: StringValueComponent;
  let emitted: (string | undefined)[];

  const render = (valueType: string, operator: Operator) => {
    fixture = TestBed.createComponent(StringValueComponent);
    component = fixture.componentInstance;
    component.valueType = valueType;
    component.operator = operator;
    emitted = [];
    component.emitValueChanged.subscribe(value => emitted.push(value));
    fixture.detectChanges();
  };

  const type = (value: string) => {
    component.inputControl.setValue(value);
    jest.advanceTimersByTime(400);
    fixture.detectChanges();
  };

  // Runs what is emitted at once (on a microtask), but not the 300 ms debounce.
  const settle = () => jest.advanceTimersByTimeAsync(0);

  // Read from the form field's subscript, where Material renders an error it has registered.
  const errorText = (): string | null =>
    (fixture.nativeElement as HTMLElement)
      .querySelector('.mat-mdc-form-field-subscript-wrapper mat-error')
      ?.textContent?.trim() ?? null;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [StringValueComponent, TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
    });
  });

  afterEach(() => jest.useRealTimers());

  it.each([ResourceLabel, Constants.TextValue])('withholds a glob-style %s pattern and says why', valueType => {
    render(valueType, Operator.IsLike);

    type('*MAL*');
    component.inputControl.markAsTouched();
    fixture.detectChanges();

    // Undefined keeps the statement incomplete, so the filter cannot be confirmed and searched.
    expect(emitted.at(-1)).toBeUndefined();
    expect(errorText()).toBe('pages.search.advancedSearch.errors.invalidRegex');
  });

  it('passes a valid pattern on', () => {
    render(ResourceLabel, Operator.IsLike);

    type('.*MAL.*');

    expect(emitted.at(-1)).toBe('.*MAL.*');
    expect(errorText()).toBeNull();
  });

  it('does not apply the regex rule to other operators', () => {
    render(ResourceLabel, Operator.Equals);

    type('*MAL*');

    expect(emitted.at(-1)).toBe('*MAL*');
  });

  it('re-validates the typed value at once when the operator switches to "is like"', async () => {
    render(ResourceLabel, Operator.Equals);
    type('*MAL*');
    expect(emitted.at(-1)).toBe('*MAL*');

    component.operator = Operator.IsLike;
    component.ngOnChanges({ operator: new SimpleChange(Operator.Equals, Operator.IsLike, false) });
    await settle();

    expect(emitted.at(-1)).toBeUndefined();
  });

  it('passes a withheld value on at once when the operator switches away from "is like"', async () => {
    render(ResourceLabel, Operator.IsLike);
    type('*MAL*');
    expect(emitted.at(-1)).toBeUndefined();

    component.operator = Operator.Equals;
    component.ngOnChanges({ operator: new SimpleChange(Operator.IsLike, Operator.Equals, false) });
    await settle();

    expect(emitted.at(-1)).toBe('*MAL*');
  });

  // Otherwise clicking Add within the debounce would confirm the filter with the value from before the edit.
  it('withholds a value at once when an edit makes it invalid', async () => {
    render(ResourceLabel, Operator.IsLike);
    type('.*MAL.*');

    component.inputControl.setValue('*MAL*');
    await settle();

    expect(emitted.at(-1)).toBeUndefined();
  });

  it('clears a withheld value when another property is picked', async () => {
    render(Constants.TextValue, Operator.IsLike);
    type('*MAL*');
    expect(emitted.at(-1)).toBeUndefined();

    // Picking a property resets the statement's operator to "equals" and drops its value. The `value` input
    // was undefined already, so only the property and the operator change.
    component.predicateIri = 'http://example.org/other';
    component.operator = Operator.Equals;
    component.ngOnChanges({
      predicateIri: new SimpleChange('http://example.org/one', 'http://example.org/other', false),
      operator: new SimpleChange(Operator.IsLike, Operator.Equals, false),
    });
    await jest.advanceTimersByTimeAsync(400);

    expect(component.inputControl.value).toBeNull();
    expect(emitted).not.toContain('*MAL*');
  });

  it('keeps the typed text when the statement hands back the undefined it was given', () => {
    render(ResourceLabel, Operator.IsLike);
    type('.*MAL.*');
    type('*MAL*');
    expect(emitted.at(-1)).toBeUndefined();

    component.value = undefined;
    component.ngOnChanges({ value: new SimpleChange('.*MAL.*', undefined, false) });

    expect(component.inputControl.value).toBe('*MAL*');
  });

  it('still applies a value set from outside', () => {
    render(ResourceLabel, Operator.IsLike);
    type('*MAL*');

    component.value = '.*other.*';
    component.ngOnChanges({ value: new SimpleChange(undefined, '.*other.*', false) });

    expect(component.inputControl.value).toBe('.*other.*');
  });
});

/**
 * A date search term is sent in the calendar the user chose, unconverted at sending (DEV-7372); a
 * calendar switch restates the entered date as the editor does.
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

    // As in the editor: a year keeps what was entered rather than taking the start of its span
    // (Julian 100 runs from Gregorian 31 Dec 99).
    it('restates a year rather than taking the start of its span', fakeAsync(() => {
      component.onDateSelected(new KnoraDate('JULIAN', 'CE', 100));
      settle();
      const seen = emitted();

      component.onCalendarSelected('GREGORIAN');
      settle();

      expect(seen).toEqual(['GREGORIAN:100']);
    }));

    it('does not switch to a calendar that cannot take the date, so selector and term agree', fakeAsync(() => {
      component.onDateSelected(new KnoraDate('GREGORIAN', 'CE', 500, 3, 15));
      settle();
      const seen = emitted();

      component.onCalendarSelected('ISLAMIC');
      settle();

      expect(component.searchCalendar()).toBe('GREGORIAN');
      expect(seen).toEqual([]);
      expect(component.availableCalendars()).not.toContain('ISLAMIC');
    }));

    it('records the chosen calendar so the picker is told it', fakeAsync(() => {
      component.onCalendarSelected('ISLAMIC');
      settle();

      expect(component.searchCalendar()).toBe('ISLAMIC');
    }));
  });

  describe('reading a stored term back into the picker', () => {
    const parse = (literal: string) => TestBed.inject(CalendarDateService).parseGravsearchDate(literal);

    it('restores the calendar the term was written in', () => {
      const date = parse('JULIAN:2024-06-02 CE');

      expect(date.calendar).toBe('JULIAN');
      expect(date.year).toBe(2024);
      expect(date.month).toBe(6);
      expect(date.day).toBe(2);
    });

    it('restores an Islamic term, which has no era', () => {
      const date = parse('ISLAMIC:1445-12-08');

      expect(date.calendar).toBe('ISLAMIC');
      expect(date.year).toBe(1445);
      expect(date.era).toBe('noEra');
    });

    // Read back as CE, the calendar library refused the term and the switch threw.
    it('switches a stored Islamic term to another calendar', fakeAsync(() => {
      component.value = 'ISLAMIC:1441-08-07';
      component.ngAfterViewInit();
      const seen = emitted();

      component.onCalendarSelected('GREGORIAN');
      settle();

      expect(seen).toEqual(['GREGORIAN:2020-04-01']);
    }));

    // Telling the picker Gregorian for a Julian term relabelled it on the next edit.
    it('tells the picker the calendar the stored term was written in', () => {
      component.value = 'JULIAN:2024-06-02 CE';
      component.ngAfterViewInit();

      expect(component.searchCalendar()).toBe('JULIAN');
    });

    it('restores a BCE term with its era', () => {
      const date = parse('JULIAN:44-03-15 BCE');

      expect(date.era).toBe('BCE');
      expect(date.year).toBe(44);
    });

    // The service both writes and reads the literal, so this pins the pair rather than one half:
    // a term read in and written out again must name the same day in the same calendar.
    it.each(['JULIAN:2024-06-02 BCE', 'GREGORIAN:1850-03', 'ISLAMIC:1445-12-08', 'GREGORIAN:1612'])(
      'round-trips %s through the service and back to the same string',
      original => {
        const date = parse(original);

        expect(date).toBeInstanceOf(KnoraDate);
        expect(TestBed.inject(CalendarDateService).format(date, 'YYYY-MM-dd', 'gravsearch')).toBe(original);
      }
    );
  });
});
