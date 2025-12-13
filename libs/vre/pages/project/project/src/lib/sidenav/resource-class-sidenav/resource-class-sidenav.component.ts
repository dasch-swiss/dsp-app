import { Component, Input, OnChanges } from '@angular/core';
import { Constants, ReadOntology, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { LocalizationService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { ResourceClassSidenavItemComponent } from './resource-class-sidenav-item.component';

@Component({
  selector: 'app-resource-class-sidenav',
  template: `
    @for (classToDisplay of classesToDisplay; track trackByFn($index, classToDisplay)) {
      <app-resource-class-sidenav-item [resClass]="classToDisplay" />
    }
  `,
  imports: [ResourceClassSidenavItemComponent],
})
export class ResourceClassSidenavComponent implements OnChanges {
  @Input({ required: true }) ontology!: ReadOntology;

  classesToDisplay: ResourceClassDefinitionWithAllLanguages[] = [];

  constructor(private readonly _localizationService: LocalizationService) {}

  ngOnChanges() {
    const classes = this.ontology.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages);
    const filtered = classes.filter(resClass => {
      if (!resClass.subClassOf.length) return false;
      const [prefix, suffix] = resClass.subClassOf[0].split('#');
      return !prefix.includes(Constants.StandoffOntology) && !suffix.includes('Standoff');
    });
    const lang = this._localizationService.getCurrentLanguage();
    this.classesToDisplay = SortingHelper.sortByLabelsAlphabetically(filtered, 'label', lang);
  }

  trackByFn = (index: number, item: ResourceClassDefinitionWithAllLanguages) => `${index}-${item.id}`;
}
