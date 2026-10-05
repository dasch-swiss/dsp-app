import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
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

  const errorText = (): string | null =>
    (fixture.nativeElement as HTMLElement).querySelector('mat-error')?.textContent?.trim() ?? null;

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

  it('re-validates the typed value when the operator switches to "is like"', () => {
    render(ResourceLabel, Operator.Equals);
    type('*MAL*');
    expect(emitted.at(-1)).toBe('*MAL*');

    component.operator = Operator.IsLike;
    component.ngOnChanges({ operator: new SimpleChange(Operator.Equals, Operator.IsLike, false) });
    jest.advanceTimersByTime(400);

    expect(emitted.at(-1)).toBeUndefined();
  });
});
