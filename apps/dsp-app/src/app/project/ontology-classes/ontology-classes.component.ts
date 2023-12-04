import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ClassDefinition, Constants } from '@dasch-swiss/dsp-js';
import { SortingService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-ontology-classes',
    templateUrl: './ontology-classes.component.html',
    styleUrls: ['./ontology-classes.component.scss'],
})
export class OntologyClassesComponent implements OnInit {
    @Input() resClasses: ClassDefinition[];

    @Input() projectMember: boolean;

    classesToDisplay: ClassDefinition[] = [];

    constructor(private _sortingService: SortingService) {}

    ngOnInit(): void {
        // display only the classes which are not a subClass of Standoff and sort them by label
        this.resClasses.forEach((resClass) => {
            if (resClass.subClassOf.length) {
                const splittedSubClass = resClass.subClassOf[0].split('#');
                if (
                    !splittedSubClass[0].includes(Constants.StandoffOntology) &&
                    !splittedSubClass[1].includes('Standoff')
                ) {
                    this.classesToDisplay.push(resClass);
                }
            }
        });
        this.classesToDisplay = this._sortingService.keySortByAlphabetical(
            this.classesToDisplay,
            'label'
        );
    }

    trackByFn = (index: number, item: ClassDefinition) => `${index}-${item.id}`;
}
