import { ClassDefinition, Constants, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/3rd-party-services/api';

export class OntologyClassHelper {
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
    return OntologyClassHelper.GetClassesToDisplay(getAllEntityDefinitionsAsArray(readOntologyClasses));
  }

  static getClassLabelByLanguage(resourceClass: ResourceClassDefinitionWithAllLanguages, language: string) {
    const preferedLangLabel = resourceClass.labels.find(l => l.language === language);
    return preferedLangLabel?.value || resourceClass.label || '';
  }
}
