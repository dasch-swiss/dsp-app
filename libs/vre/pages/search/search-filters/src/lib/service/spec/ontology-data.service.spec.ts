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
import { TranslateLoader } from '@ngx-translate/core';
import { firstValueFrom, of, skip, throwError } from 'rxjs';
import { RDFS_LABEL, ResourceLabel } from '../../constants';
import { OntologyDataService } from '../ontology-data.service';

/**
 * Acceptance specs for the i18n DTO contract introduced by DEV-6645.
 *
 * Verifies that `OntologyDataService` is purely a data-propagation layer:
 * `resourceClasses$`, `getSubclassesOfResourceClass$`, and `_toPredicate`
 * forward `labels: StringLiteralV2[]` (and `comments`) unchanged from the
 * source ontology definitions — no normalisation, no flattening, no
 * translation logic. Display-time language resolution is the responsibility
 * of the consuming components (via `appStringifyStringLiteral` /
 * `pickPreferredLanguageString`).
 */

function makeStringLiterals(values: Record<string, string>): StringLiteralV2[] {
  return Object.entries(values).map(([language, value]) => ({ language, value }));
}

function makeClassDef(
  id: string,
  labels: StringLiteralV2[],
  comments: StringLiteralV2[] = [],
  subClassOf: string[] = []
): ResourceClassDefinitionWithAllLanguages {
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

  // Per-locale sentinel values. The contract under test is "for every supported
  // language, the service walks the dotted i18n key and stores the resolved
  // string as a StringLiteralV2 on the synthetic predicate". The *content* of
  // the real translation files is irrelevant to that contract and is owned by
  // translators — using obvious sentinels keeps the spec stable across copy
  // changes and makes the propagation intent unmistakable.
  const RESOURCE_LABEL_BY_LANG: Record<string, string> = {
    en: 'rdfs-label-en',
    de: 'rdfs-label-de',
    fr: 'rdfs-label-fr',
    it: 'rdfs-label-it',
    rm: 'rdfs-label-rm',
  };

  function makeTranslateStub() {
    return {
      getTranslation: jest.fn((lang: string) =>
        of({
          pages: { search: { advancedSearch: { resourceLabel: RESOURCE_LABEL_BY_LANG[lang] ?? '' } } },
        })
      ),
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: {} },
        { provide: DestroyRef, useValue: { onDestroy: () => () => {} } },
        { provide: LocalizationService, useValue: createMockLocalizationService('en').service },
        { provide: TranslateLoader, useValue: makeTranslateStub() },
      ],
    });
    service = TestBed.inject(OntologyDataService);
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

  describe('setOntology — loading + error settling (DEV-6576 Phase 3a.1)', () => {
    // These need a real connection stub whose getOntology we control per-test, so they build their own
    // TestBed rather than reuse the outer one (which provides an empty connection).
    const buildWithConnection = (getOntology: jest.Mock) => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OntologyDataService,
          { provide: DspApiConnectionToken, useValue: { v2: { onto: { getOntology } } } },
          { provide: DestroyRef, useValue: { onDestroy: () => () => {} } },
          { provide: LocalizationService, useValue: createMockLocalizationService('en').service },
          { provide: TranslateLoader, useValue: makeTranslateStub() },
        ],
      });
      return TestBed.inject(OntologyDataService);
    };

    it('settles loading to false and clears error on a successful load', async () => {
      const fakeOntology = { id: 'http://example/onto', getClassDefinitionsByType: () => [] } as any;
      const svc = buildWithConnection(jest.fn().mockReturnValue(of(fakeOntology)));

      svc.setOntology('http://example/onto');

      expect(await firstValueFrom(svc.ontologyLoading$)).toBe(false);
      expect(await firstValueFrom(svc.ontologyError$)).toBeNull();
    });

    it('settles loading to false and exposes the error when the load fails', async () => {
      const err = new Error('ontology not found');
      const svc = buildWithConnection(jest.fn().mockReturnValue(throwError(() => err)));

      svc.setOntology('http://example/bad');

      // The critical property: loading does NOT hang true on failure (a hanging spinner on a shared
      // URL naming a bad ontology is exactly what this fix prevents).
      expect(await firstValueFrom(svc.ontologyLoading$)).toBe(false);
      expect(await firstValueFrom(svc.ontologyError$)).toBe(err);
    });

    it('clears a prior error when a new load starts', async () => {
      const getOntology = jest
        .fn()
        .mockReturnValueOnce(throwError(() => new Error('boom')))
        .mockReturnValueOnce(of({ id: 'http://example/ok', getClassDefinitionsByType: () => [] } as any));
      const svc = buildWithConnection(getOntology);

      svc.setOntology('http://example/bad');
      expect(await firstValueFrom(svc.ontologyError$)).not.toBeNull();

      svc.setOntology('http://example/ok');
      expect(await firstValueFrom(svc.ontologyError$)).toBeNull();
      expect(await firstValueFrom(svc.ontologyLoading$)).toBe(false);
    });
  });

  describe('getProperties$ — synthetic rdfs:label predicate', () => {
    it('prepends a synthetic rdfs:label predicate with labels for every supported language', async () => {
      const hasAuthorLabels = makeStringLiterals({ en: 'has author', de: 'hat Autor' });
      const propDef = makePropDef('http://example/hasAuthor', hasAuthorLabels);
      pushOntology(service, [], [propDef]);

      const properties = await firstValueFrom(service.getProperties$());

      expect(properties.length).toBeGreaterThan(0);
      const first = properties[0];
      expect(first.iri).toBe(RDFS_LABEL);
      expect(first.objectValueType).toBe(ResourceLabel);
      expect(first.isLinkProperty).toBe(false);

      // Every supported locale resolved from the i18n fixture.
      const byLang = new Map(first.labels.map(l => [l.language, l.value]));
      expect(byLang.get('en')).toBe('rdfs-label-en');
      expect(byLang.get('de')).toBe('rdfs-label-de');
      expect(byLang.get('fr')).toBe('rdfs-label-fr');
      expect(byLang.get('it')).toBe('rdfs-label-it');
      expect(byLang.get('rm')).toBe('rdfs-label-rm');

      // Backend-supplied property still follows.
      expect(properties[1].iri).toBe('http://example/hasAuthor');
    });
  });
});
