import { TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule } from '@ngx-translate/core';
import { MultiLanguageFieldsComponent } from './multi-language-fields.component';
import { MultiLanguageFormArray } from './multi-language-form-array.type';
import { MultiLanguageMode } from './multi-language-mode';

describe('MultiLanguageFieldsComponent', () => {
  const fb = new FormBuilder();
  const formArrayOf = (entries: { language: AvailableLanguage; value: string }[]) =>
    fb.array(
      entries.map(e => fb.nonNullable.group({ language: e.language, value: e.value }))
    ) as unknown as MultiLanguageFormArray;

  function render(
    formArray: MultiLanguageFormArray,
    mode: MultiLanguageMode,
    multiline = false,
    ui = 'en',
    focusLanguage?: string
  ) {
    TestBed.configureTestingModule({
      imports: [MultiLanguageFieldsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [{ provide: LocalizationService, useValue: { currentLanguage: ui } }],
    });
    const fixture = TestBed.createComponent(MultiLanguageFieldsComponent);
    fixture.componentInstance.formArray = formArray;
    fixture.componentInstance.label = 'Label';
    fixture.componentInstance.multiline = multiline;
    fixture.componentInstance.mode = mode;
    fixture.componentInstance.validators = [Validators.maxLength(5)];
    fixture.componentInstance.focusLanguage = focusLanguage;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const field = (language: string) => el.querySelector(`[data-cy="multi-language-${language}"]`) as HTMLInputElement;
    const tab = (language: string) =>
      el.querySelector(`[data-cy="multi-language-tab-${language}"]`) as HTMLButtonElement;
    const type = (language: string, text: string) => {
      field(language).value = text;
      field(language).dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const pick = (language: string) => {
      tab(language).click();
      fixture.detectChanges();
    };
    return { fixture, el, field, tab, type, pick };
  }

  describe('all languages', () => {
    it('shows every language in its own field, filled with its text', () => {
      const { el, field } = render(formArrayOf([{ language: 'en', value: 'Book' }]), 'all');
      expect(el.querySelectorAll('input').length).toBe(5);
      expect(field('en').value).toBe('Book');
      expect(field('de').value).toBe('');
    });

    it('shows text areas when multiline', () => {
      const { el } = render(formArrayOf([]), 'all', true);
      expect(el.querySelectorAll('textarea').length).toBe(5);
    });

    it('adds a language once typed in, with the validators', () => {
      const formArray = formArrayOf([{ language: 'en', value: 'Book' }]);
      const { type } = render(formArray, 'all');
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
      const { type } = render(formArray, 'all');
      type('en', '');
      expect(formArray.getRawValue()).toEqual([{ language: 'de', value: 'Buch' }]);
    });
  });

  describe('one at a time', () => {
    it('shows one field, in the interface language when it has a text, and a tab per language', () => {
      const { el, field } = render(
        formArrayOf([
          { language: 'en', value: 'Book' },
          { language: 'de', value: 'Buch' },
        ]),
        'one',
        false,
        'de'
      );
      expect(el.querySelectorAll('input').length).toBe(1);
      expect(el.querySelectorAll('[role="tab"]').length).toBe(5);
      expect(field('de').value).toBe('Buch');
    });

    it('starts on the first language with a text when the interface language has none', () => {
      const { field } = render(formArrayOf([{ language: 'fr', value: 'Livre' }]), 'one');
      expect(field('fr').value).toBe('Livre');
    });

    it('marks the tabs of the languages with a text, and counts them', () => {
      const { el, tab } = render(formArrayOf([{ language: 'en', value: 'Book' }]), 'one');
      expect(tab('en').classList).toContain('filled');
      expect(tab('de').classList).not.toContain('filled');
      expect(el.querySelector('[data-cy="multi-language-count"]')).not.toBeNull();
    });

    it('edits the language picked, and marks its tab once it has a text', () => {
      const formArray = formArrayOf([{ language: 'en', value: 'Book' }]);
      const { tab, type, pick } = render(formArray, 'one');
      pick('it');
      type('it', 'Libro');
      expect(formArray.getRawValue()).toEqual([
        { language: 'en', value: 'Book' },
        { language: 'it', value: 'Libro' },
      ]);
      expect(tab('it').classList).toContain('filled');
      expect(tab('it').getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('opened on a language', () => {
    it('shows that language and focuses its field, as when a table cell asks to edit it', () => {
      const { el, field } = render(formArrayOf([{ language: 'en', value: 'Book' }]), 'one', false, 'en', 'fr');
      expect(el.querySelectorAll('input').length).toBe(1);
      expect(field('fr')).toBeTruthy();
      expect(document.activeElement).toBe(field('fr'));
    });

    it('focuses that language among all of them', () => {
      const { field } = render(formArrayOf([{ language: 'en', value: 'Book' }]), 'all', false, 'en', 'de');
      expect(document.activeElement).toBe(field('de'));
    });
  });
});
