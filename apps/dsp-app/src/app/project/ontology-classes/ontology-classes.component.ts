import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ClassDefinition, Constants } from '@dasch-swiss/dsp-js';
import { SortingService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ontology-classes',
  templateUrl: './ontology-classes.component.html',
  styleUrls: ['./ontology-classes.component.scss'],
})
export class OntologyClassesComponent {
  @Input() resClasses: ClassDefinition[];

  @Input() projectMember: boolean;

  // display only the classes which are not a subClass of Standoff and sort them by label
  get classesToDisplay(): ClassDefinition[] {
    const classesToDisplay = [];
    this.resClasses.forEach(resClass => {
      if (resClass.subClassOf.length) {
        const splittedSubClass = resClass.subClassOf[0].split('#');
        if (!splittedSubClass[0].includes(Constants.StandoffOntology) && !splittedSubClass[1].includes('Standoff')) {
          classesToDisplay.push(resClass);
        }
      }
    });

    return this._sortingService.keySortByAlphabetical(classesToDisplay, 'label');
  }

  constructor(private _sortingService: SortingService) {}

  trackByFn = (index: number, item: ClassDefinition) => `${index}-${item.id}`;
}
