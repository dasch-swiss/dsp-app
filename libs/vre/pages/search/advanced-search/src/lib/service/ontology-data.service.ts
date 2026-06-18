import { DestroyRef, Inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Constants,
  KnoraApiConnection,
  ReadOntology,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import {
  LocalizationService,
  pickPreferredLanguageString,
  SortingHelper,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, startWith, switchMap } from 'rxjs';
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

  constructor(
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _destroyRef: DestroyRef,
    private readonly _localizationService: LocalizationService
  ) {}

  init(projectIri: string, ontology?: IriLabelPair) {
    this._dspApiConnection.v2.onto
      .getOntologiesByProjectIri(projectIri)
      .pipe(
        map(r =>
          r.ontologies.map(o => ({
            iri: o.id,
            labels: toLabels(o.label),
            comments: [],
          }))
        ),
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
    this._dspApiConnection.v2.onto
      .getOntology(ontologyIri, true)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ontology => {
          this._selectedOntology.next(ontology);
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
    if (!classIri) {
      return this._propertyDefinitions$.pipe(map(props => props.map(p => this._toPredicate(p))));
    }
    return combineLatest([this._getPropertyIrisOfClass$(classIri), this._propertyDefinitions$]).pipe(
      map(([resProps, props]) => props.filter(p => resProps.includes(p.id)).map(p => this._toPredicate(p)))
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
    return ontology
      ? {
          iri: ontology.id,
          labels: toLabels(ontology.label),
          comments: [],
        }
      : ({ iri: '', labels: [], comments: [] } as IriLabelPair);
  }

  get classIris(): string[] {
    const ontology = this._selectedOntology.value;
    if (!ontology) {
      return [];
    }
    return ontology.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages).map(c => c.id);
  }
}
