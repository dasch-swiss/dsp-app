import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import {
  Cardinality,
  ClassDefinition,
  Constants,
  KnoraApiConnection,
  PropertyDefinition,
  ReadOntology,
  ResourcePropertyDefinitionWithAllLanguages,
  UpdateOntology,
  UpdateResourceClassCardinality,
} from '@dasch-swiss/dsp-js';
import { GuiCardinality } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DefaultClass, DefaultProperty } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors, OntologyProperties, PropToDisplay } from '@dasch-swiss/vre/shared/app-state';
import { DialogService } from '@dasch-swiss/vre/shared/app-ui';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-resource-class-info-element',
  template: ` <div cdkDrag [cdkDragDisabled]="!ontology.lastModificationDate || !canChangeGuiOrder || !userCanEdit">
    <div class="drag-n-drop-placeholder" *cdkDragPlaceholder></div>
    <mat-list-item class="property" [disabled]="loadProperty">
      <span cdkDragHandle matListItemIcon class="list-icon gui-order">
        <span [class.hide-on-hover]="canChangeGuiOrder && (lastModificationDate$ | async) && userCanEdit">
          {{ i + 1 }})
        </span>
        <span
          *ngIf="canChangeGuiOrder && (lastModificationDate$ | async) && userCanEdit"
          class="display-on-hover drag-n-drop-handle">
          <mat-icon>drag_indicator</mat-icon>
        </span>
      </span>
      <!-- display only properties if they exist in list of properties;
                                                                                                                                                                                                                                                       objectType is not a linkValue (otherwise we have the property twice) -->
      <span matListItemTitle>
        <app-resource-class-property-info
          class="property-info"
          [propDef]="prop?.propDef"
          [propCard]="prop"
          [props]="props"
          [projectUuid]="projectUuid"
          [classIri]="resourceClass.id"
          [lastModificationDate]="lastModificationDate$ | async"
          [userCanEdit]="userCanEdit"
          [resourceClass]="resourceClass"
          (removePropertyFromClass)="removePropertyFromClass.emit($event)">
        </app-resource-class-property-info>
      </span>
    </mat-list-item>
  </div>`,
  styles: [
    `
      :host:hover {
        .hide-on-hover {
          display: none;
        }

        .display-on-hover {
          display: block;
        }
      }

      .display-on-hover {
        display: none;
      }

      .drag-n-drop-handle {
        cursor: move;
        color: black;
      }

      .cdk-drag-handle {
        margin-right: 8px !important;
      }

      .hide-on-hover {
        color: black;
      }
    `,
  ],
})
export class ResourceClassInfoElementComponent implements OnInit {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input() userCanEdit: boolean;
  @Input() resourceClass: ClassDefinition;
  @Input() projectUuid: string;
  @Input() prop: PropToDisplay;
  @Input() props: PropToDisplay[];
  @Input() i: number; // index

  @Output() removePropertyFromClass = new EventEmitter<DefaultClass>();

  @Select(OntologiesSelectors.currentProjectOntologyProperties)
  currentProjectOntologyProperties$: Observable<OntologyProperties[]>;

  currentOntology$ = this._store.select(OntologiesSelectors.currentOntology);

  lastModificationDate$ = this.currentOntology$.pipe(
    takeUntil(this.ngUnsubscribe),
    map(x => x?.lastModificationDate)
  );

  ontology: ReadOntology;
  canChangeGuiOrder = true; // TODO
  loadProperty = false;

  constructor(private _store: Store) {}

  ngOnInit() {
    this.ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
  }
}
