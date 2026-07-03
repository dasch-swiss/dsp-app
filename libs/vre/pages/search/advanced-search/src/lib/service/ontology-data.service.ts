import { DestroyRef, Inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Constants,
  KnoraApiConnection,
  ReadOntology,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
  StringLiteralV2,
} from '@dasch-swiss/dsp-js';
import { AvailableLanguageKeys, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import {
  LocalizationService,
  pickPreferredLanguageString,
  SortingHelper,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateLoader } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ALL_RESOURCE_CLASSES, RDFS_LABEL, RESOURCE_LABEL_TRANSLATION_KEY, ResourceLabel } from '../constants';
import { IriLabelPair, Predicate } from '../model';
import { toLabels } from '../util/labels';

@Injectable()
export class OntologyDataService {
  private _ontologies = new BehaviorSubject<IriLabelPair[]>([]);
  ontologies$ = this._ontologies.asObservable();

  private _selectedOntology = new BehaviorSubject<ReadOntology | null>(null);
  selectedOntology$ = this._selectedOntology.asObservable();

  private _ontologyLoading = new BehaviorSubject<boolean>(true);
  ontologyLoading$ = this._ontologyLoading.asObservable();

  // Set when an ontology load fails; cleared when a new load starts. Lets consumers surface an error
  // state instead of a spinner that never resolves (DEV-6576 Phase 3a.1). `null` = no error.
  private _ontologyError = new BehaviorSubject<unknown | null>(null);
  ontologyError$ = this._ontologyError.asObservable();

  /**
   * Synthetic `rdfs:label` predicate that every consumer of the predicate
   * stream sees as if it were a normal property. The backend omits
   * `rdfs:label` as property of resource classes in the ReadOntology response. (The property "rdfs label" is
   * universal and ontologically required by the base model. It is and will always be available in data.).
   * As it is not available in the ontology response as veritable property, we materialize it here once,
   * with labels resolved per supported locale from the i18n JSON.
   *
   * Seeded with an empty `labels` array; each entry is appended as the
   * configured `TranslateLoader.getTranslation(lang)` resolves it.
   */
  private _resourceLabelPredicate$ = new BehaviorSubject<Predicate>(
    new Predicate(RDFS_LABEL, [], ResourceLabel, false)
  );

  constructor(
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _destroyRef: DestroyRef,
    private readonly _localizationService: LocalizationService,
    private readonly _translateLoader: TranslateLoader
  ) {
    this._initResourceLabelPredicate();
  }

  private _initResourceLabelPredicate(): void {
    const labels: StringLiteralV2[] = [];
    for (const language of AvailableLanguageKeys) {
      this._translateLoader
        .getTranslation(language)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(translations => {
          const value = this._readKey(translations, RESOURCE_LABEL_TRANSLATION_KEY);
          // Replace any existing entry for this language to keep the array deduped
          const next = labels.filter(l => l.language !== language);
          next.push({ language, value });
          labels.length = 0;
          labels.push(...next);
          this._resourceLabelPredicate$.next(new Predicate(RDFS_LABEL, [...labels], ResourceLabel, false));
        });
    }
  }

  /** Walks a dotted i18n key (e.g. `a.b.c`) through a nested translations object. */
  private _readKey(translations: unknown, key: string): string {
    const parts = key.split('.');
    let node: unknown = translations;
    for (const part of parts) {
      if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[part];
      } else {
        return '';
      }
    }
    return typeof node === 'string' ? node : '';
  }

  init(projectIri: string, ontology?: IriLabelPair) {
    this._dspApiConnection.v2.onto
      .getOntologiesByProjectIri(projectIri)
      .pipe(
        map(r => r.ontologies.map(o => this._toIriLabelPair(o.id, toLabels(o.label), []))),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: ontologies => {
          this._ontologies.next(ontologies);
          if (ontologies.length > 0) {
            this.setOntology(ontology?.iri || ontologies[0].iri);
          }
        },
      });
  }

  setOntology(ontologyIri: string) {
    this._ontologyLoading.next(true);
    this._ontologyError.next(null);
    this._dspApiConnection.v2.onto
      .getOntology(ontologyIri, true)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ontology => {
          this._selectedOntology.next(ontology);
          this._ontologyLoading.next(false);
        },
        // Without this branch a failed load leaves `ontologyLoading` stuck true, so any consumer
        // gating on readiness (e.g. SearchDerivationService.loading$) hangs forever — notably a
        // shared URL naming a bad/unreachable ontology (DEV-6576 Phase 3a.1).
        error: err => {
          this._ontologyError.next(err);
          this._ontologyLoading.next(false);
        },
      });
  }

  private _resourceClassDefinitions$ = combineLatest([
    this.selectedOntology$.pipe(filter((o): o is ReadOntology => o !== null)),
    this._localizationService.currentLanguage$,
  ]).pipe(
    map(([o, lang]) => ({
      classes: o.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages),
      lang,
    })),
    map(({ classes, lang }) =>
      [...classes].sort((a, b) =>
        SortingHelper.compareStringsByLanguage(
          pickPreferredLanguageString(a.labels, lang),
          pickPreferredLanguageString(b.labels, lang),
          lang
        )
      )
    )
  );

  resourceClasses$: Observable<IriLabelPair[]> = this._resourceClassDefinitions$.pipe(
    startWith([]),
    map(resClasses =>
      resClasses.map((resClassDef: ResourceClassDefinitionWithAllLanguages) =>
        this._toIriLabelPair(resClassDef.id, resClassDef.labels, resClassDef.comments)
      )
    )
  );

  getResourceClassObjectsForProperty$(propertyIri?: string): Observable<IriLabelPair[]> {
    if (!propertyIri) {
      return this.resourceClasses$;
    }

    return combineLatest([this.resourceClasses$, this._propertyDefinitions$]).pipe(
      map(([resClasses, propDefs]) => {
        const objectType = propDefs.find(p => p.id === propertyIri)?.objectType;
        return { resClasses, objectType };
      }),
      switchMap(({ resClasses, objectType }) => {
        if (!objectType) return of([]);

        return this.getSubclassesOfResourceClass$(objectType).pipe(
          map(subs => {
            const direct = resClasses.filter(rc => rc.iri === objectType);
            const merged = [...direct, ...subs];

            // dedupe by iri
            const byIri = new Map(merged.map(x => [x.iri, x]));
            return [...byIri.values()];
          })
        );
      })
    );
  }

  getSubclassesOfResourceClass$ = (classIri: string): Observable<IriLabelPair[]> =>
    this._resourceClassDefinitions$.pipe(
      map(resClasses =>
        resClasses
          .filter(r => r.subClassOf.includes(classIri))
          .map(r => this._toIriLabelPair(r.id, r.labels, r.comments))
      )
    );

  private _propertyDefinitions$: Observable<ResourcePropertyDefinitionWithAllLanguages[]> = combineLatest([
    this.selectedOntology$.pipe(filter((o): o is ReadOntology => o !== null)),
    this._localizationService.currentLanguage$,
  ]).pipe(
    map(([o, lang]) => ({
      props: o
        .getPropertyDefinitionsByType(ResourcePropertyDefinitionWithAllLanguages)
        .filter(propDef => propDef.isEditable && !propDef.isLinkValueProperty),
      lang,
    })),
    map(({ props, lang }) =>
      [...props].sort((a, b) =>
        SortingHelper.compareStringsByLanguage(
          pickPreferredLanguageString(a.labels, lang),
          pickPreferredLanguageString(b.labels, lang),
          lang
        )
      )
    )
  );

  getProperties$(classIri?: string): Observable<Predicate[]> {
    const rest$ = !classIri
      ? this._propertyDefinitions$.pipe(map(props => props.map(p => this._toPredicate(p))))
      : combineLatest([this._getPropertyIrisOfClass$(classIri), this._propertyDefinitions$]).pipe(
          map(([resProps, props]) => props.filter(p => resProps.includes(p.id)).map(p => this._toPredicate(p)))
        );

    // `rdfs:label` is universal, mandatory, and missing from the API's
    // property list — prepend it so every consumer sees a uniform stream.
    return combineLatest([this._resourceLabelPredicate$, rest$]).pipe(
      map(([resourceLabel, rest]) => [resourceLabel, ...rest])
    );
  }

  private _getPropertyIrisOfClass$ = (classIri: string): Observable<string[]> =>
    this._resourceClassDefinitions$.pipe(
      map(resClasses => resClasses.find(r => r.id === classIri)),
      filter((resClass): resClass is ResourceClassDefinitionWithAllLanguages => resClass !== undefined),
      map((resClass: ResourceClassDefinitionWithAllLanguages) =>
        resClass.propertiesList.map(property => property.propertyIndex)
      )
    );

  private _toPredicate(propDef: ResourcePropertyDefinitionWithAllLanguages): Predicate {
    const predicate = new Predicate(
      propDef.id,
      propDef.labels ?? [],
      propDef.objectType || '',
      propDef.isLinkProperty,
      undefined,
      propDef.comments ?? []
    );
    if (
      propDef.objectType === Constants.ListValue &&
      propDef.guiAttributes.length === 1 &&
      propDef.guiAttributes[0].startsWith('hlist=')
    ) {
      predicate.listObjectIri = propDef.guiAttributes[0].substring(7, propDef.guiAttributes[0].length - 1);
    }
    return predicate;
  }

  private _toIriLabelPair(
    iri: string,
    labels: IriLabelPair['labels'] | undefined,
    comments: IriLabelPair['comments'] | undefined
  ): IriLabelPair {
    return { iri, labels: labels ?? [], comments: comments ?? [] };
  }

  get selectedOntology(): IriLabelPair {
    const ontology = this._selectedOntology.value;
    return ontology ? this._toIriLabelPair(ontology.id, toLabels(ontology.label), []) : ALL_RESOURCE_CLASSES;
  }

  get classIris(): string[] {
    const ontology = this._selectedOntology.value;
    if (!ontology) {
      return [];
    }
    return ontology.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages).map(c => c.id);
  }
}
