import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import {
  ApiResponseError,
  CanDoResponse,
  Constants,
  KnoraApiConnection,
  ReadOntology,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import {
  DefaultClass,
  DefaultProperty,
  OntologyService,
  PropertyInfoObject,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { ListsSelectors, OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';

export interface ShortInfo {
  id: string;
  label: string;
  comment: string;
  restrictedToClass?: string;
}

@Component({
  selector: 'app-property-info',
  templateUrl: './property-info.component.html',
  styleUrls: ['./property-info.component.scss'],
  animations: [
    // the fade-in/fade-out animation.
    // https://www.kdechant.com/blog/angular-animations-fade-in-and-fade-out
    trigger('simpleFadeAnimation', [
      // the "in" style determines the "resting" state of the element when it is visible.
      state('in', style({ opacity: 1 })),

      // fade in when created.
      transition(':enter', [
        // the styles start from this point when the element appears
        style({ opacity: 0 }),
        // and animate toward the "in" state above
        animate(150),
      ]),

      // fade out when destroyed.
      transition(
        ':leave',
        // fading out uses a different syntax, with the "style" being passed into animate()
        animate(150, style({ opacity: 0 }))
      ),
    ]),
  ],
})
export class PropertyInfoComponent implements OnInit {
  @Input({ required: true }) propDef!: ResourcePropertyDefinitionWithAllLanguages;

  @Input() projectUuid!: string;

  @Input() projectStatus!: boolean;

  @Input() userCanEdit = false;

  @Output() editResourceProperty: EventEmitter<PropertyInfoObject> = new EventEmitter<PropertyInfoObject>();

  @Output() deleteResourceProperty: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

  private _projectOntologies: ReadOntology[] = [];

  propAttribute: string | undefined;
  propAttributeComment: string | undefined;

  usedByClasses: ShortInfo[] = [];

  showActionBubble = false;
  propCanBeDeleted = false;

  isLockHovered = false;

  get propType(): DefaultProperty {
    return this._ontoService.getDefaultPropertyType(this.propDef);
  }

  get propertiesBaseOntology(): string | undefined {
    return this.propDef.objectType?.split('#')[0];
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _ontoService: OntologyService,
    private _store: Store
  ) {
    this._projectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
  }

  ngOnInit() {
    this._collectUsedByClasses();

    if (this.propDef.isLinkProperty || this.propDef.objectType === Constants.ListValue) {
      this._setAdditionalAttributes();
    }
  }

  private _collectUsedByClasses() {
    this._projectOntologies.forEach(onto => {
      getAllEntityDefinitionsAsArray(onto.classes).forEach(resClass => {
        const usedByClass = resClass.propertiesList.some(prop => prop.propertyIndex === this.propDef.id);
        const isAlreadyAdded = this.usedByClasses.some(c => c.id === resClass.id);

        if (usedByClass && !isAlreadyAdded) {
          this.usedByClasses.push({
            id: resClass.id,
            label: resClass.label!,
            comment: `${onto.label}: ${resClass.comment}`,
            restrictedToClass: this.propDef.isLinkProperty ? this.propDef.subjectType : undefined,
          });
        }
      });
    });
    this.usedByClasses.sort((a, b) => (a.label > b.label ? 1 : -1));
  }

  private _setAdditionalAttributes() {
    if (this.propDef.objectType && this.propDef.objectType === Constants.Region) {
      this.propAttribute = 'Region';
      return;
    }

    if (this.propDef.isLinkProperty && this.propDef.objectType && this.propDef.objectType !== Constants.Region) {
      const currentOntology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
      const onto =
        this.propertiesBaseOntology === currentOntology?.id
          ? currentOntology
          : this._projectOntologies.find(i => i.id === this.propertiesBaseOntology);

      this.propAttribute = onto?.classes[this.propDef.objectType]?.label ?? '';
      this.propAttributeComment = onto?.classes[this.propDef.objectType]?.comment ?? '';
      return;
    }

    if (this.propDef.objectType === Constants.ListValue) {
      const currentProjectsLists = this._store.selectSnapshot(ListsSelectors.listsInProject);
      const listIri = this.propDef.guiAttributes[0].split('<')[1].replace(/>/g, '');
      const listUrl = `/project/${this.projectUuid}/lists/${encodeURIComponent(listIri)}`;
      const list = currentProjectsLists.find(i => i.id === listIri);
      this.propAttribute = `<a href="${listUrl}">${list?.labels[0].value}</a>`;
      this.propAttributeComment = list?.comments.length ? list.comments[0].value : '';
    }
  }

  trackByFn = (index: number, item: ShortInfo) => item.id;

  canBeDeleted(): void {
    this._dspApiConnection.v2.onto
      .canDeleteResourceProperty(this.propDef.id)
      .subscribe((canDoRes: CanDoResponse | ApiResponseError) => {
        if (canDoRes instanceof CanDoResponse) {
          this.propCanBeDeleted = canDoRes.canDo;
        }
      });
  }

  mouseEnter() {
    this.canBeDeleted();
    this.showActionBubble = true;
  }

  mouseLeave() {
    this.showActionBubble = false;
  }
}
