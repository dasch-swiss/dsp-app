import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { Cardinality, Constants, ReadLinkValue, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { ResourceSelectors } from '@dasch-swiss/vre/shared/app-state';
import { PagerComponent } from '@dasch-swiss/vre/shared/app-ui';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { IncomingOrStandoffLink } from './incoming-link.interface';
import { PropertiesDisplayIncomingLinkService } from './properties-display-incoming-link.service';
import { PropertiesDisplayService } from './properties-display.service';
import { sortByKeys } from './sortByKeys';

@Component({
  selector: 'app-properties-display',
  template: `
    <div style="display: flex; align-items: center; background: #EAEFF3; margin-bottom: 8px">
      <h3 style="margin: 0 16px" *ngIf="displayLabel" data-cy="property-header">{{ resource.res.label }}</h3>
      <div style="display: flex; justify-content: end; flex: 1">
        <app-properties-toolbar
          [showToggleProperties]="true"
          [showOnlyIcons]="displayLabel"
          style="flex-shrink: 0"></app-properties-toolbar>
        <app-resource-toolbar
          *ngIf="displayLabel"
          [adminPermissions]="adminPermissions"
          [resource]="resource"
          [linkToNewTab]="linkToNewTab"
          (afterResourceDeleted)="afterResourceDeleted.emit()" />
      </div>
    </div>

    <div
      class="infobar mat-caption"
      *ngIf="displayLabel && ((resourceAttachedUser$ | async) !== undefined || resource.res.creationDate)">
      Created
      <span *ngIf="resourceAttachedUser$ | async as resourceAttachedUser">
        by
        {{
          resourceAttachedUser.username
            ? resourceAttachedUser.username
            : resourceAttachedUser.givenName + ' ' + resourceAttachedUser.familyName
        }}
      </span>
      <span *ngIf="resource.res.creationDate"> on {{ resource.res.creationDate | date }}</span>
    </div>

    <!-- list of properties -->
    <ng-container>
      <ng-container *ngIf="editableProperties && editableProperties.length > 0; else noProperties">
        <app-property-row
          [class]="getRowClass(showAllProperties$ | async, prop.values.length)"
          *ngFor="let prop of editableProperties; let last = last; trackBy: trackByPropertyInfoFn"
          [borderBottom]="true"
          [tooltip]="prop.propDef.comment"
          [prop]="prop"
          [label]="
            prop.propDef.label +
            (prop.guiDef.cardinality === cardinality._1 || prop.guiDef.cardinality === cardinality._1_n ? '*' : '')
          ">
          <app-existing-property-value [prop]="prop" [resource]="resource.res"></app-existing-property-value>
        </app-property-row>
      </ng-container>
    </ng-container>

    <!-- standoff link -->
    <ng-container>
      <app-property-row
        tooltip=" Represent a link in standoff markup from one resource to another"
        label="has Standoff link"
        [borderBottom]="true"
        [class]="getRowClass(showAllProperties$ | async, standoffLinks.length)">
        <app-incoming-standoff-link-value [links]="standoffLinks"></app-incoming-standoff-link-value>
      </app-property-row>
    </ng-container>

    <!-- incoming link -->
    <app-property-row
      tooltip="Indicates that this resource is referred to by another resource"
      label="has incoming link"
      [borderBottom]="true"
      class="incoming-link"
      [class]="getRowClass(showAllProperties$ | async, (incomingLinks$ | async).length)">
      <app-incoming-standoff-link-value
        *ngIf="(incomingLinks$ | async)?.length > 0"
        [links]="incomingLinks$ | async"></app-incoming-standoff-link-value>
      <dasch-swiss-app-pager #pager (pageChanged)="pageChanged()"></dasch-swiss-app-pager>
    </app-property-row>

    <ng-template #noProperties>
      <app-property-row label="info" [borderBottom]="false">
        This resource has no defined properties.
      </app-property-row>
      <div *ngIf="resource.res.isDeleted">
        <app-property-row label="Deleted on" [borderBottom]="true">
          {{ resource.res.deleteDate | date }}
        </app-property-row>
        <app-property-row label="Comment" [borderBottom]="false">
          {{ resource.res.deleteComment }}
        </app-property-row>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .infobar {
        text-align: right;
        padding-right: 6px;
      }

      ::ng-deep {
        .incoming-link .paging-container {
          border-bottom: none;
        }
      }

      .show-property-row {
        display: block;
      }

      .hide-property-row {
        display: none;
      }
    `,
  ],
  providers: [PropertiesDisplayService, PropertiesDisplayIncomingLinkService],
})
export class PropertiesDisplayComponent implements OnChanges, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input({ required: true }) resource!: DspResource;
  @Input({ required: true }) properties!: PropertyInfoValues[];
  @Input() displayLabel = false;
  @Input() adminPermissions = false;
  @Input() linkToNewTab?: string;
  @Output() afterResourceDeleted = new EventEmitter();

  @ViewChild('pager', { static: false })
  pagerComponent: PagerComponent | undefined;

  protected readonly cardinality = Cardinality;

  resourceAttachedUser$ = this._store.select(ResourceSelectors.attachedUsers).pipe(
    takeUntil(this.ngUnsubscribe),
    map(attachedUsers =>
      attachedUsers[this.resource.res.id]?.value.find(u => u.id === this.resource.res.attachedToUser)
    )
  );

  editableProperties: PropertyInfoValues[] = [];
  incomingLinks$ = new BehaviorSubject<IncomingOrStandoffLink[]>([]);
  incomingLinks: IncomingOrStandoffLink[] = [];
  showAllProperties$ = this._propertiesDisplayService.showAllProperties$;

  standoffLinks: IncomingOrStandoffLink[] = [];

  constructor(
    private _cd: ChangeDetectorRef,
    private _propertiesDisplayService: PropertiesDisplayService,
    private _store: Store,
    private _propertiesDisplayIncomingLink: PropertiesDisplayIncomingLinkService
  ) {}

  ngOnChanges() {
    this._setupProperties();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private _setupProperties(offset: number = 0) {
    this.editableProperties = this.properties.filter(prop => (prop.propDef as ResourcePropertyDefinition).isEditable);

    this.incomingLinks$.next([]);
    if (this.pagerComponent) {
      this.pagerComponent!.initPager();
    }

    this.doIncomingLinkSearch(offset);
    this.setStandOffLinks();
  }

  pageChanged() {
    this.incomingLinks$.next(
      this.incomingLinks.slice(this.pagerComponent?.currentRangeStart, this.pagerComponent?.currentRangeEnd)
    );
  }

  doIncomingLinkSearch(offset = 0) {
    this._propertiesDisplayIncomingLink
      .getIncomingLinksRecursively$(this.resource.res.id, offset)
      .pipe(take(1))
      .subscribe(incomingLinks => {
        this.incomingLinks = incomingLinks;
        this.incomingLinks$.next(incomingLinks.slice(0, PagerComponent.pageSize));
        this._cd.detectChanges();
        if (incomingLinks.length > 0) {
          this.pagerComponent!.calculateNumberOfAllResults(incomingLinks.length);
        }
      });
  }

  trackByPropertyInfoFn = (index: number, item: PropertyInfoValues) => `${index}-${item.propDef.id}`;

  private setStandOffLinks() {
    this.standoffLinks = (
      (this.properties.find(prop => prop.propDef.id === Constants.HasStandoffLinkToValue)?.values as ReadLinkValue[]) ??
      []
    ).map(link => {
      const resourceIdPathOnly = link.linkedResourceIri.match(/[^\/]*\/[^\/]*$/);
      if (!resourceIdPathOnly) {
        throw new Error('Linked resource IRI is not in the expected format');
      }

      return {
        label: link.strval ?? '',
        uri: `/resource/${resourceIdPathOnly[0]}`,
        project: link.linkedResource?.resourceClassLabel ?? '',
      };
    });
    this.standoffLinks = sortByKeys(this.standoffLinks, ['project', 'label']);
  }

  getRowClass(showAllProperties: boolean, valuesLength: number): string {
    return showAllProperties || valuesLength > 0 ? 'show-property-row' : 'hide-property-row';
  }
}
