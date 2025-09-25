import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { Constants, ReadOntology, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { LocalizationService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-class-sidenav',
  template: `
    @for (classToDisplay of classesToDisplay; track trackByFn($index, classToDisplay)) {
      <div>
        <app-resource-class-sidenav-item [resClass]="classToDisplay" />
      </div>
    }
  `,
  standalone: false,
})
export class ResourceClassSidenavComponent implements OnChanges {
  @Input({ required: true }) ontology!: ReadOntology;

  classesToDisplay: ResourceClassDefinitionWithAllLanguages[] = [];

  constructor(private _localizationService: LocalizationService) {}

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
