import { Injectable } from '@angular/core';
import { ClassDefinition, Constants } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-api';

/**
 * helper methods for the ontology editor
 */
@Injectable({
  providedIn: 'root',
})
export class OntologyClassService {
  static GetClassesToDisplay(resClasses: ClassDefinition[]): ClassDefinition[] {
    const classesToDisplay: ClassDefinition[] = [];
    resClasses.forEach(resClass => {
      if (resClass.subClassOf.length) {
        const splittedSubClass = resClass.subClassOf[0].split('#');
        if (!splittedSubClass[0].includes(Constants.StandoffOntology) && !splittedSubClass[1].includes('Standoff')) {
          classesToDisplay.push(resClass);
        }
      }
    });

    return classesToDisplay;
  }

  static GetReadOntologyClassesToDisplay(readOntologyClasses: { [index: string]: ClassDefinition }): ClassDefinition[] {
    return OntologyClassService.GetClassesToDisplay(getAllEntityDefinitionsAsArray(readOntologyClasses));
  }
}
