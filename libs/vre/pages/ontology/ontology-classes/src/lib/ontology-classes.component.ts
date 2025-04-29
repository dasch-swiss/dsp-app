import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ClassDefinition } from '@dasch-swiss/dsp-js';
import { LocalizationService, OntologyClassHelper, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ontology-classes',
  template: `
    <div *ngFor="let class of classesToDisplay; trackBy: trackByFn">
      <app-ontology-class-item [resClass]="class" [projectMember]="projectMember" />
    </div>
  `,
})
export class OntologyClassesComponent {
  @Input({ required: true }) resClasses!: ClassDefinition[];
  @Input({ required: true }) projectMember!: boolean;

  get classesToDisplay(): ClassDefinition[] {
    const classesToDisplay = OntologyClassHelper.GetClassesToDisplay(this.resClasses);
    const language = this._localizationService.getCurrentLanguage();
    return this._sortingService.sortLabelsAlphabetically(classesToDisplay, 'label', language);
  }

  constructor(
    private _sortingService: SortingService,
    private _localizationService: LocalizationService
  ) {}

  trackByFn = (index: number, item: ClassDefinition) => `${index}-${item.id}`;
}
