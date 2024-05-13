import { Inject, Injectable } from '@angular/core';
import {
  Constants,
  KnoraApiConnection,
  ReadOntology,
  ReadResource,
  ResourceClassDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

/**
 * This service gather methods that needs to be refactored (mainly State management) in order to get property "resourceClasses" in LinkValue2Component.
 * It has been copy paste from original link-value.component.ts
 * TODO: Refactor and remove this service.
 */
@Injectable()
export class LinkValueDataService {
  resourceClasses!: ResourceClassDefinition[];
  subClasses: ResourceClassDefinition[] = [];
  properties!: ResourcePropertyDefinition[];
  restrictToResourceClass!: string;

  currentOntoIri!: string; // For resourceClasses
  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  onInit(currentOntoIri: string, parentResource: ReadResource, propIri: any) {
    const linkType = parentResource.getLinkPropertyIriFromLinkValuePropertyIri(propIri);
    this.restrictToResourceClass = parentResource.entityInfo.properties[linkType].objectType || '';

    this.currentOntoIri = currentOntoIri;

    this._dspApiConnection.v2.ontologyCache
      .getOntology(this.currentOntoIri)
      .subscribe((ontoMap: Map<string, ReadOntology>) => {
        // filter out knorabase ontology
        const filteredOntoMap = new Map(Array.from(ontoMap).filter(([key]) => key !== Constants.KnoraApiV2));

        let resClasses: ResourceClassDefinition[] = [];

        // loop through each ontology in the project and create an array of ResourceClassDefinitions
        filteredOntoMap.forEach(onto => {
          resClasses = resClasses.concat(
            filteredOntoMap.get(onto.id)?.getClassDefinitionsByType(ResourceClassDefinition) ?? []
          );
        });

        // add the superclass to the list of resource classes
        this.resourceClasses = resClasses.filter(
          (resClassDef: ResourceClassDefinition) => resClassDef.id === this.restrictToResourceClass
        );

        // recursively loop through all of the superclass's subclasses, including nested subclasses
        // and add them to the list of resource classes
        this.resourceClasses = this.resourceClasses.concat(
          this._getSubclasses(resClasses, this.restrictToResourceClass)
        );

        this.properties =
          filteredOntoMap.get(this.currentOntoIri)?.getPropertyDefinitionsByType(ResourcePropertyDefinition) ?? [];
      });
  }

  /**
   * given a resource class Iri, return all subclasses
   * @param resClasses List of all resource class definitions in the ontology
   * @param resClassRestrictionIri The IRI of the resource class to filter the list of resource class defintions by
   * @returns An array of all subclasses of type ResourceClassDefinition
   */
  private _getSubclasses(
    resClasses: ResourceClassDefinition[],
    resClassRestrictionIri: string
  ): ResourceClassDefinition[] {
    // filter list by the provided IRI to find all subclasses of the provided IRI
    const subclasses = resClasses.filter(
      (resClassDef: ResourceClassDefinition) => resClassDef.subClassOf.indexOf(resClassRestrictionIri) > -1
    );

    // add the filtered list to the list of all subclasses
    this.subClasses = this.subClasses.concat(subclasses);

    // if the provided IRI has subclasses, recursively call this function to find any subclasses of those subclasses
    if (subclasses.length) {
      subclasses.forEach(sub => {
        this._getSubclasses(resClasses, sub.id);
      });
    }

    return this.subClasses;
  }
}
