import { DestroyRef, Inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Constants,
  KnoraApiConnection,
  ReadOntology,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { RDFS_LABEL, ResourceLabel, SEARCH_ALL_RESOURCE_CLASSES_OPTION } from '../constants';
import { IriLabelPair, Predicate } from '../model';

@Injectable()
export class OntologyDataService {
  private readonly ResourceLabelPropertyData = new Predicate(RDFS_LABEL, 'Resource Label', ResourceLabel, false);

  private _ontologies = new BehaviorSubject<IriLabelPair[]>([]);
  ontologies$ = this._ontologies.asObservable();

  private _selectedOntology = new BehaviorSubject<ReadOntology | null>(null);
  selectedOntology$ = this._selectedOntology.asObservable();

  private _ontologyLoading = new BehaviorSubject<boolean>(true);
  ontologyLoading$ = this._ontologyLoading.asObservable();

  constructor(
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _destroyRef: DestroyRef
  ) {}

  init(projectIri: string, ontology?: IriLabelPair) {
    this._dspApiConnection.v2.onto
      .getOntologiesByProjectIri(projectIri)
      .pipe(
        map(r => r.ontologies.map(o => ({ iri: o.id, label: o.label }))),
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

  private _resourceClassDefinitions$ = this.selectedOntology$.pipe(
    filter((o): o is ReadOntology => o !== null),
    map(o => o.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages)),
    map(xs =>
      [...xs].sort((a: ResourceClassDefinitionWithAllLanguages, b: ResourceClassDefinitionWithAllLanguages) =>
        (a.label || '').localeCompare(b.label || '')
      )
    )
  );

  resourceClasses$: Observable<IriLabelPair[]> = this._resourceClassDefinitions$.pipe(
    startWith([]),
    map(resClasses =>
      resClasses.map((resClassDef: ResourceClassDefinitionWithAllLanguages) => {
        return { iri: resClassDef.id, label: resClassDef.label || '' };
      })
    )
  );

  getResourceClassObjectsForProperty$(propertyIri?: string): Observable<IriLabelPair[]> {
    if (!propertyIri) {
      return this.resourceClasses$.pipe(
        map(classes => [SEARCH_ALL_RESOURCE_CLASSES_OPTION, ...classes]),
        startWith([SEARCH_ALL_RESOURCE_CLASSES_OPTION])
      );
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
        resClasses.filter(r => r.subClassOf.includes(classIri)).map(r => ({ iri: r.id, label: r.label || '' }))
      )
    );

  private _propertyDefinitions$: Observable<ResourcePropertyDefinition[]> = this.selectedOntology$.pipe(
    filter((o): o is ReadOntology => o !== null),
    map(o => o.getPropertyDefinitionsByType(ResourcePropertyDefinition)),
    map(props => props.filter(propDef => propDef.isEditable && !propDef.isLinkValueProperty)),
    map(xs =>
      [...xs].sort((a: ResourcePropertyDefinition, b: ResourcePropertyDefinition) =>
        (a.label || '').localeCompare(b.label || '')
      )
    )
  );

  getProperties$(classIri?: string): Observable<Predicate[]> {
    const withResourceLabel = (preds: Predicate[]) => [this.ResourceLabelPropertyData, ...preds];
    if (!classIri) {
      return this._propertyDefinitions$.pipe(map(props => withResourceLabel(props.map(this._toPredicate))));
    }
    return combineLatest([this._getPropertyIrisOfClass$(classIri), this._propertyDefinitions$]).pipe(
      map(([resProps, props]) => withResourceLabel(props.filter(p => resProps.includes(p.id)).map(this._toPredicate)))
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

  private _toPredicate(propDef: ResourcePropertyDefinition): Predicate {
    const predicate = new Predicate(propDef.id, propDef.label || '', propDef.objectType || '', propDef.isLinkProperty);
    if (
      propDef.objectType === Constants.ListValue &&
      propDef.guiAttributes.length === 1 &&
      propDef.guiAttributes[0].startsWith('hlist=')
    ) {
      predicate.listObjectIri = propDef.guiAttributes[0].substring(7, propDef.guiAttributes[0].length - 1);
    }
    return predicate;
  }

  get selectedOntology(): IriLabelPair {
    return this._selectedOntology.value
      ? { iri: this._selectedOntology.value.id, label: this._selectedOntology.value.label || '' }
      : ({} as IriLabelPair);
  }

  get classIris(): string[] {
    const ontology = this._selectedOntology.value;
    if (!ontology) {
      return [];
    }
    return ontology.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages).map(c => c.id);
  }
}
