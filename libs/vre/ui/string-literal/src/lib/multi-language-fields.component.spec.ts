import { TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { MultiLanguageFieldsComponent } from './multi-language-fields.component';
import { MultiLanguageFormArray } from './multi-language-form-array.type';

describe('MultiLanguageFieldsComponent', () => {
  const fb = new FormBuilder();
  const formArrayOf = (entries: { language: AvailableLanguage; value: string }[]) =>
    fb.array(
      entries.map(e => fb.nonNullable.group({ language: e.language, value: e.value }))
    ) as unknown as MultiLanguageFormArray;

  function render(formArray: MultiLanguageFormArray, multiline = false) {
    TestBed.configureTestingModule({ imports: [MultiLanguageFieldsComponent, NoopAnimationsModule] });
    const fixture = TestBed.createComponent(MultiLanguageFieldsComponent);
    fixture.componentInstance.formArray = formArray;
    fixture.componentInstance.label = 'Label';
    fixture.componentInstance.multiline = multiline;
    fixture.componentInstance.validators = [Validators.maxLength(5)];
    fixture.detectChanges();
    const field = (language: string) =>
      fixture.nativeElement.querySelector(`[data-cy="multi-language-${language}"]`) as HTMLInputElement;
    const type = (language: string, text: string) => {
      field(language).value = text;
      field(language).dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    return { fixture, field, type };
  }

  it('shows every language in its own field, filled with its text', () => {
    const { fixture, field } = render(formArrayOf([{ language: 'en', value: 'Book' }]));
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(5);
    expect(field('en').value).toBe('Book');
    expect(field('de').value).toBe('');
  });

  it('shows text areas when multiline', () => {
    const { fixture } = render(formArrayOf([]), true);
    expect(fixture.nativeElement.querySelectorAll('textarea').length).toBe(5);
  });

  it('adds a language once typed in, with the validators', () => {
    const formArray = formArrayOf([{ language: 'en', value: 'Book' }]);
    const { type } = render(formArray);
    type('de', 'Buch');
    expect(formArray.getRawValue()).toEqual([
      { language: 'en', value: 'Book' },
      { language: 'de', value: 'Buch' },
    ]);
    type('de', 'Bücher');
    expect(formArray.controls[1].controls.value.errors).toEqual({ maxlength: expect.anything() });
  });

  it('removes a language once its field is emptied', () => {
    const formArray = formArrayOf([
      { language: 'en', value: 'Book' },
      { language: 'de', value: 'Buch' },
    ]);
    const { type } = render(formArray);
    type('en', '');
    expect(formArray.getRawValue()).toEqual([{ language: 'de', value: 'Buch' }]);
  });
});
