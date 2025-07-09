import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { Constants, ReadOntology, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/3rd-party-services/api';
import { LocalizationService, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-class-sidenav',
  template: `
    <div *ngFor="let classToDisplay of classesToDisplay; trackBy: trackByFn">
      <app-resource-class-sidenav-item [resClass]="classToDisplay" />
    </div>
  `,
})
export class ResourceClassSidenavComponent implements OnChanges {
  @Input({ required: true }) ontology!: ReadOntology;

  classesToDisplay: ResourceClassDefinitionWithAllLanguages[] = [];

  constructor(
    private _localizationService: LocalizationService,
    private _sortingService: SortingService
  ) {}

  ngOnChanges() {
    const classes = getAllEntityDefinitionsAsArray(this.ontology.classes) as ResourceClassDefinitionWithAllLanguages[];
    const filtered = classes.filter(resClass => {
      if (!resClass.subClassOf.length) return false;
      const [prefix, suffix] = resClass.subClassOf[0].split('#');
      return !prefix.includes(Constants.StandoffOntology) && !suffix.includes('Standoff');
    });
    const lang = this._localizationService.getCurrentLanguage();
    this.classesToDisplay = this._sortingService.sortLabelsAlphabetically(filtered, 'label', lang);
  }

  trackByFn = (index: number, item: ResourceClassDefinitionWithAllLanguages) => `${index}-${item.id}`;
}
