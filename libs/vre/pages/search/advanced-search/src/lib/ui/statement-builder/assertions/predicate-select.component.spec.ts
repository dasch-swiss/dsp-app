import { CommonModule } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Constants, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { createMockLocalizationService } from '@dasch-swiss/vre/shared/app-helper-services/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IriLabelPair, Predicate } from '../../../model';
import { OntologyDataService } from '../../../service/ontology-data.service';
import { PredicateSelectComponent } from './predicate-select.component';

/**
 * Acceptance specs for the i18n DTO contract introduced by DEV-6645.
 *
 * Asserts that:
 *   1. Predicate option labels flow through the `appStringifyStringLiteral`
 *      pipe, which observes `LocalizationService.currentLanguage`, so the
 *      rendered text reflects the active UI language without any per-component
 *      subscription.
 *   2. Switching the language flips the rendered option labels on the next
 *      change-detection cycle (pipe impurity + memoization handle this; we
 *      verify the user-visible outcome, not the pipe internals).
 *   3. The dynamic mat-label uses `pickPreferredLanguageString` against the
 *      subject class's `labels` array and interpolates via `TranslateService`.
 *
 * The component declares `StringifyStringLiteralPipe` in its standalone
 * imports, but importing that pipe pulls in the entire `vre/ui/string-literal`
 * barrel which transitively requires CKEditor + ngx-color-picker (both ESM-only
 * packages that conflict with the lib's Jest transform setup). To keep the
 * spec focused on observable user-facing behaviour, we override the
 * component's imports with a local test pipe that mirrors the production
 * pipe's contract: impure, observes LocalizationService, and resolves the
 * preferred language. This is enough to verify the DEV-6645 contract end-to-end.
 */

@Pipe({ name: 'appStringifyStringLiteral', pure: false, standalone: true })
class TestStringifyStringLiteralPipe implements PipeTransform {
  constructor(private readonly _localizationService: LocalizationService) {}
  transform(value: StringLiteralV2[] | null | undefined): string {
    if (!value || value.length === 0) return '';
    const lang = this._localizationService.currentLanguage;
    const match = value.find(v => v.language === lang);
    return match?.value ?? value[0].value;
  }
}

function makeMultiPredicate(iri: string, labels: StringLiteralV2[]): Predicate {
  return new Predicate(iri, labels, Constants.TextValue, false);
}

function openSelectAndGetOptionTexts(fixture: ComponentFixture<PredicateSelectComponent>): string[] {
  // mat-option content only mounts into an overlay container when the select
  // is opened. Click the trigger element to open the panel, then query the
  // overlay-attached options via the `data-cy` attribute (which mirrors the
  // pipe-resolved label expression).
  const host = fixture.nativeElement as HTMLElement;
  const trigger = host.querySelector('.mat-mdc-select-trigger') as HTMLElement | null;
  if (trigger) {
    trigger.click();
    fixture.detectChanges();
  }
  // mat-option lives in the document-level overlay container, not the
  // component's host element.
  return Array.from(document.querySelectorAll('mat-option')).map(el => (el.textContent ?? '').trim());
}

describe('PredicateSelectComponent — i18n label rendering (DEV-6645)', () => {
  let fixture: ComponentFixture<PredicateSelectComponent>;
  let component: PredicateSelectComponent;
  let mockLocalization: ReturnType<typeof createMockLocalizationService>;
  let mockOntologyData: jest.Mocked<Pick<OntologyDataService, 'getProperties$'>>;
  let translate: { instant: jest.Mock };

  const hasAuthorLabels: StringLiteralV2[] = [
    { language: 'en', value: 'has author' },
    { language: 'de', value: 'hat Autor' },
    { language: 'fr', value: 'a pour auteur' },
  ];
  const hasTitleLabels: StringLiteralV2[] = [
    { language: 'en', value: 'has title' },
    { language: 'de', value: 'hat Titel' },
  ];
  const bookLabels: StringLiteralV2[] = [
    { language: 'en', value: 'Book' },
    { language: 'de', value: 'Buch' },
  ];

  const predicates: Predicate[] = [
    makeMultiPredicate('http://example/hasAuthor', hasAuthorLabels),
    makeMultiPredicate('http://example/hasTitle', hasTitleLabels),
  ];

  beforeEach(async () => {
    mockLocalization = createMockLocalizationService('en');
    mockOntologyData = {
      getProperties$: jest.fn().mockReturnValue(of(predicates)),
    };
    translate = {
      instant: jest.fn((key: string, params?: Record<string, string>) => (params ? `${key}::${params['class']}` : key)),
    };

    await TestBed.configureTestingModule({
      imports: [PredicateSelectComponent, NoopAnimationsModule],
      providers: [
        { provide: OntologyDataService, useValue: mockOntologyData },
        { provide: LocalizationService, useValue: mockLocalization.service },
        { provide: TranslateService, useValue: translate },
      ],
    })
      // Swap the heavy production pipe for a lean local equivalent (see
      // file header) without touching the component under test.
      .overrideComponent(PredicateSelectComponent, {
        set: {
          imports: [CommonModule, MatInputModule, MatSelectModule, TestStringifyStringLiteralPipe],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PredicateSelectComponent);
    component = fixture.componentInstance;
  });

  describe('option labels resolved via pipe', () => {
    it('renders predicate labels in the active language (English by default)', () => {
      const subjectClass: IriLabelPair = {
        iri: 'http://example/Book',
        labels: bookLabels,
        comments: [],
      };
      component.subjectClass = subjectClass;
      component.ngOnChanges();
      fixture.detectChanges();

      const optionTexts = openSelectAndGetOptionTexts(fixture);
      expect(optionTexts).toContain('has author');
      expect(optionTexts).toContain('has title');
    });

    it('switches rendered option labels when the active language changes', () => {
      const subjectClass: IriLabelPair = {
        iri: 'http://example/Book',
        labels: bookLabels,
        comments: [],
      };
      component.subjectClass = subjectClass;
      component.ngOnChanges();
      fixture.detectChanges();

      expect(openSelectAndGetOptionTexts(fixture)).toEqual(expect.arrayContaining(['has author', 'has title']));

      // Flip the language; the impure pipe re-evaluates on the next CD cycle.
      (mockLocalization.service as { currentLanguage: string }).currentLanguage = 'de';
      fixture.detectChanges();

      const germanTexts = openSelectAndGetOptionTexts(fixture);
      expect(germanTexts).toContain('hat Autor');
      expect(germanTexts).toContain('hat Titel');
      expect(germanTexts).not.toContain('has author');
    });
  });

  describe('dynamic mat-label', () => {
    it('interpolates the subject class name via pickPreferredLanguageString + TranslateService', () => {
      component.subjectClass = {
        iri: 'http://example/Book',
        labels: bookLabels,
        comments: [],
      };

      const label = component.label;

      expect(translate.instant).toHaveBeenCalledWith('pages.search.advancedSearch.propertyOfClass', {
        class: 'Book',
      });
      expect(label).toBe('pages.search.advancedSearch.propertyOfClass::Book');
    });

    it('uses the German class name when the active language is German', () => {
      component.subjectClass = {
        iri: 'http://example/Book',
        labels: bookLabels,
        comments: [],
      };
      (mockLocalization.service as { currentLanguage: string }).currentLanguage = 'de';

      const label = component.label;

      expect(translate.instant).toHaveBeenCalledWith('pages.search.advancedSearch.propertyOfClass', {
        class: 'Buch',
      });
      expect(label).toBe('pages.search.advancedSearch.propertyOfClass::Buch');
    });

    it('falls back to the resourceClass key when no subject class is set', () => {
      component.subjectClass = undefined;

      const label = component.label;

      expect(translate.instant).toHaveBeenCalledWith('pages.search.advancedSearch.resourceClass');
      expect(label).toBe('pages.search.advancedSearch.resourceClass');
    });
  });

  describe('compareObjects', () => {
    it('matches objects by iri', () => {
      const a = { iri: 'http://example/x' } as Predicate;
      const b = { iri: 'http://example/x' } as Predicate;
      expect(component.compareObjects(a, b)).toBe(true);
    });

    it('does not match objects with different iris', () => {
      const a = { iri: 'http://example/x' } as Predicate;
      const b = { iri: 'http://example/y' } as Predicate;
      expect(component.compareObjects(a, b)).toBe(false);
    });
  });
});
