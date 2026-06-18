import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  Constants,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
  StringLiteralV2,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { createMockLocalizationService } from '@dasch-swiss/vre/shared/app-helper-services/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, skip } from 'rxjs';
import { RDFS_LABEL, ResourceLabel } from '../../constants';
import { OntologyDataService } from '../ontology-data.service';

/**
 * Acceptance specs for the i18n DTO contract introduced by DEV-6645.
 *
 * Asserts that:
 *   1. `resourceClasses$`, `getSubclassesOfResourceClass$`, and `_toPredicate`
 *      propagate `labels: StringLiteralV2[]` (and `comments`) unchanged from
 *      the source ontology definitions — no normalisation, no flattening.
 *   2. `_resourceLabelPropertyData` and `searchAllResourceClassesOption` are
 *      synthesised from i18n JSON via `labelsFromI18n` (no hard-coded fallback
 *      strings) — every supported UI language is represented in the resulting
 *      `labels` array.
 */

const ENGLISH_LABEL_KEY = 'pages.search.advancedSearch.resourceLabel';
const ALL_CLASSES_KEY = 'pages.search.advancedSearch.allResourceClasses';

const LANGUAGE_KEYS = ['en', 'de', 'fr', 'it', 'rm'] as const;

/**
 * Mock that mirrors `labelsFromI18n`'s contract:
 * `translate.getParsedResult(translate.translations[language] ?? {}, key)`.
 * Each language's translations map echoes the key prefixed by the language
 * code so assertions can verify per-language sourcing without coupling to
 * production i18n JSON.
 */
function buildTranslateMock(): TranslateService {
  const translations: Record<string, Record<string, string>> = {};
  for (const lang of LANGUAGE_KEYS) {
    translations[lang] = {
      [ENGLISH_LABEL_KEY]: `[${lang}] Resource Label`,
      [ALL_CLASSES_KEY]: `[${lang}] All resource classes`,
    };
  }
  return {
    instant: (key: string) => key,
    get: (key: string) => ({ subscribe: (cb: (v: string) => void) => cb(key) }),
    getParsedResult: (table: Record<string, string>, key: string) => table[key] ?? key,
    translations,
    onLangChange: { subscribe: () => ({ unsubscribe: () => {} }) },
    onTranslationChange: { subscribe: () => ({ unsubscribe: () => {} }) },
    onDefaultLangChange: { subscribe: () => ({ unsubscribe: () => {} }) },
  } as unknown as TranslateService;
}

function makeStringLiterals(values: Record<string, string>): StringLiteralV2[] {
  return Object.entries(values).map(([language, value]) => ({ language, value }));
}

function makeClassDef(
  id: string,
  labels: StringLiteralV2[],
  comments: StringLiteralV2[] = [],
  subClassOf: string[] = []
): ResourceClassDefinitionWithAllLanguages {
  // ResourceClassDefinitionWithAllLanguages is a DSP-JS class with many
  // fields the service does not touch; the cast keeps the fixture minimal.
  return {
    id,
    labels,
    comments,
    subClassOf,
    propertiesList: [],
  } as unknown as ResourceClassDefinitionWithAllLanguages;
}

function makePropDef(
  id: string,
  labels: StringLiteralV2[],
  comments: StringLiteralV2[] = [],
  options: { objectType?: string; isLinkProperty?: boolean; guiAttributes?: string[] } = {}
): ResourcePropertyDefinitionWithAllLanguages {
  return {
    id,
    labels,
    comments,
    objectType: options.objectType ?? Constants.TextValue,
    isLinkProperty: options.isLinkProperty ?? false,
    isEditable: true,
    isLinkValueProperty: false,
    guiAttributes: options.guiAttributes ?? [],
  } as unknown as ResourcePropertyDefinitionWithAllLanguages;
}

/**
 * Push a fake ReadOntology into the service's private `_selectedOntology`
 * BehaviorSubject so the production observable pipelines
 * (`_resourceClassDefinitions$`, `_propertyDefinitions$`) emit. We deliberately
 * reach through `as any` because we are validating the public contract of the
 * service against fixture data, not testing how DSP-JS materialises ontologies.
 */
function pushOntology(
  service: OntologyDataService,
  classes: ResourceClassDefinitionWithAllLanguages[],
  props: ResourcePropertyDefinitionWithAllLanguages[]
): void {
  const fakeOntology = {
    getClassDefinitionsByType: () => classes,
    getPropertyDefinitionsByType: () => props,
  };
  (service as any)._selectedOntology.next(fakeOntology);
}

describe('OntologyDataService — i18n DTO propagation (DEV-6645)', () => {
  let service: OntologyDataService;
  let translate: TranslateService;
  const { service: mockLocalizationService } = createMockLocalizationService('en');

  beforeEach(() => {
    translate = buildTranslateMock();

    TestBed.configureTestingModule({
      providers: [
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: {} },
        { provide: DestroyRef, useValue: { onDestroy: () => () => {} } },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: TranslateService, useValue: translate },
      ],
    });
    service = TestBed.inject(OntologyDataService);
  });

  describe('searchAllResourceClassesOption', () => {
    it('is built from i18n JSON via labelsFromI18n, one entry per supported language', () => {
      const option = service.searchAllResourceClassesOption;

      expect(option.iri).toBe('');
      expect(option.labels).toHaveLength(LANGUAGE_KEYS.length);
      expect(option.comments).toEqual([]);

      for (const lang of LANGUAGE_KEYS) {
        const entry = option.labels.find(l => l.language === lang);
        expect(entry).toBeDefined();
        // value comes from the stubbed translations table — proves the
        // synthesis went through labelsFromI18n + TranslateService, not a
        // hard-coded fallback string.
        expect(entry!.value).toBe(`[${lang}] All resource classes`);
      }
    });
  });

  describe('ResourceLabel synthetic predicate (via getProperties$)', () => {
    it('exposes labels from i18n JSON for every supported language', async () => {
      // Empty ontology so getProperties$ emits only the synthetic predicate.
      pushOntology(service, [], []);

      const predicates = await firstValueFrom(service.getProperties$());
      const resourceLabelPredicate = predicates.find(p => p.iri === RDFS_LABEL);

      expect(resourceLabelPredicate).toBeDefined();
      expect(resourceLabelPredicate!.objectValueType).toBe(ResourceLabel);
      expect(resourceLabelPredicate!.isLinkProperty).toBe(false);
      expect(resourceLabelPredicate!.labels).toHaveLength(LANGUAGE_KEYS.length);

      for (const lang of LANGUAGE_KEYS) {
        const entry = resourceLabelPredicate!.labels.find(l => l.language === lang);
        expect(entry).toBeDefined();
        expect(entry!.value).toBe(`[${lang}] Resource Label`);
      }
    });
  });

  describe('_toPredicate', () => {
    it('threads labels and comments through unchanged from the source property definition', () => {
      const labels = makeStringLiterals({ en: 'has author', de: 'hat Autor' });
      const comments = makeStringLiterals({ en: 'the author', de: 'der Autor' });
      const propDef = makePropDef('http://example/hasAuthor', labels, comments);

      const predicate = (service as any)._toPredicate(propDef);

      expect(predicate.iri).toBe('http://example/hasAuthor');
      expect(predicate.labels).toBe(labels); // identity — no clone, no flatten
      expect(predicate.comments).toBe(comments);
      expect(predicate.objectValueType).toBe(Constants.TextValue);
      expect(predicate.isLinkProperty).toBe(false);
    });

    it('defaults labels and comments to [] when the source omits them', () => {
      const propDef = makePropDef('http://example/x', undefined as any, undefined as any);

      const predicate = (service as any)._toPredicate(propDef);

      expect(predicate.labels).toEqual([]);
      expect(predicate.comments).toEqual([]);
    });

    it('extracts the hlist IRI from guiAttributes for ListValue properties', () => {
      const propDef = makePropDef('http://example/category', makeStringLiterals({ en: 'Category' }), [], {
        objectType: Constants.ListValue,
        guiAttributes: ['hlist=<http://rdfh.ch/lists/0000/list-iri>'],
      });

      const predicate = (service as any)._toPredicate(propDef);

      expect(predicate.listObjectIri).toBe('http://rdfh.ch/lists/0000/list-iri');
    });
  });

  describe('resourceClasses$ / getSubclassesOfResourceClass$', () => {
    it('propagates labels and comments unchanged from the source class definitions', async () => {
      const labels = makeStringLiterals({ en: 'Book', de: 'Buch', fr: 'Livre' });
      const comments = makeStringLiterals({ en: 'a book', de: 'ein Buch' });
      const def = makeClassDef('http://example/Book', labels, comments);
      pushOntology(service, [def], []);

      // Skip the `startWith([])` emission and read the mapped class list.
      const classes = await firstValueFrom(service.resourceClasses$.pipe(skip(1)));
      const book = classes.find(c => c.iri === 'http://example/Book');

      expect(book).toBeDefined();
      expect(book!.labels).toEqual(labels);
      expect(book!.comments).toEqual(comments);
    });

    it('returns subclasses with their labels and comments preserved', async () => {
      const parentIri = 'http://example/Document';
      const childLabels = makeStringLiterals({ en: 'Letter', de: 'Brief' });
      const childComments = makeStringLiterals({ en: 'a letter' });
      const child = makeClassDef('http://example/Letter', childLabels, childComments, [parentIri]);
      const unrelated = makeClassDef('http://example/Painting', makeStringLiterals({ en: 'Painting' }), [], []);
      pushOntology(service, [child, unrelated], []);

      const subs = await firstValueFrom(service.getSubclassesOfResourceClass$(parentIri));

      expect(subs).toHaveLength(1);
      expect(subs[0].iri).toBe('http://example/Letter');
      expect(subs[0].labels).toEqual(childLabels);
      expect(subs[0].comments).toEqual(childComments);
    });
  });
});
