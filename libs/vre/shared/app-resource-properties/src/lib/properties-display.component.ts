import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Cardinality, Constants, ReadLinkValue, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { ResourceSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Observable, of, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { IncomingOrStandoffLink } from './incoming-link.interface';
import { PropertiesDisplayIncomingLinkService } from './properties-display-incoming-link.service';
import { PropertiesDisplayService } from './properties-display.service';
import { sortByKeys } from './sortByKeys';

@Component({
  selector: 'app-properties-display',
  template: `
    <div style="display: flex; align-items: center; background: #EAEFF3; margin-bottom: 8px">
      <h3 style="margin: 0 16px" *ngIf="displayLabel">{{ resource.res.label }}</h3>
      <div style="display: flex; justify-content: end; flex: 1">
        <app-properties-toolbar [showToggleProperties]="true" [showOnlyIcons]="displayLabel"></app-properties-toolbar>
        <app-resource-toolbar
          *ngIf="displayLabel"
          [adminPermissions]="adminPermissions"
          [resource]="resource"></app-resource-toolbar>
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
    <ng-container *ngIf="myProperties$ | async as myProperties">
      <ng-container *ngIf="myProperties.length > 0; else noProperties">
        <app-property-row
          *ngFor="let prop of myProperties; let last = last; trackBy: trackByPropertyInfoFn"
          [borderBottom]="true"
          [tooltip]="prop.propDef.comment"
          [label]="
            prop.propDef.label +
            (prop.guiDef.cardinality === cardinality._1 || prop.guiDef.cardinality === cardinality._1_n ? '*' : '')
          ">
          <app-existing-property-value [prop]="prop" [resource]="resource.res"></app-existing-property-value>
        </app-property-row>
      </ng-container>
    </ng-container>

    <!-- standoff link -->
    <ng-container *ngIf="showStandoffLinks$ | async">
      <app-property-row
        *ngIf="incomingLinks$ | async as incomingLinks"
        tooltip=" Represent a link in standoff markup from one resource to another"
        label="has Standoff link"
        [borderBottom]="true">
        <app-incoming-standoff-link-value [links]="standoffLinks"></app-incoming-standoff-link-value>
      </app-property-row>
    </ng-container>

    <!-- incoming link -->
    <ng-container *ngIf="showIncomingLinks$ | async">
      <app-property-row
        *ngIf="incomingLinks$ | async as incomingLinks"
        tooltip="Indicates that this resource is referred to by another resource"
        label="has incoming link"
        [borderBottom]="true">
        <app-incoming-standoff-link-value [links]="incomingLinks"></app-incoming-standoff-link-value>
      </app-property-row>
    </ng-container>

    <ng-container *ngIf="false">
      <app-property-row label="info" [borderBottom]="false">
        This resource has no defined properties.
      </app-property-row>
    </ng-container>

    <ng-template #noProperties>
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

  resourceAttachedUser$ = this._store.select(ResourceSelectors.attachedUsers).pipe(
    takeUntil(this.ngUnsubscribe),
    map(attachedUsers =>
      attachedUsers[this.resource.res.id]?.value.find(u => u.id === this.resource.res.attachedToUser)
    )
  );
  myProperties$: Observable<PropertyInfoValues[]> = of([]);
  incomingLinks$: Observable<IncomingOrStandoffLink[]> = of([]);
  showIncomingLinks$ = of(false);

  standoffLinks: IncomingOrStandoffLink[] = [];
  showStandoffLinks$ = of(false);

  constructor(
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

  private _setupProperties() {
    this.myProperties$ = this._propertiesDisplayService.showAllProperties$.pipe(
      map(showAllProps =>
        this.properties
          .filter(prop => (prop.propDef as ResourcePropertyDefinition).isEditable)
          .filter(prop => {
            return showAllProps || (prop.values && prop.values.length > 0);
          })
      )
    );

    this.incomingLinks$ = this._propertiesDisplayIncomingLink.getIncomingLinks$(this.resource.res.id, 0);
    this.showIncomingLinks$ = this.incomingLinks$.pipe(
      switchMap(links => (links.length > 0 ? of(true) : this._propertiesDisplayService.showAllProperties$))
    );

    this.standoffLinks = (
      (this.properties.find(prop => prop.propDef.id === Constants.HasStandoffLinkToValue)?.values as ReadLinkValue[]) ??
      []
    ).map(link => {
      return {
        label: link.strval,
        uri: `/resource/${link.linkedResourceIri.match(/[^\/]*\/[^\/]*$/)[0]}`,
        project: link.linkedResource.resourceClassLabel,
      };
    });
    this.standoffLinks = sortByKeys(this.standoffLinks, ['project', 'label']);
    this.showStandoffLinks$ = this._propertiesDisplayService.showAllProperties$.pipe(
      map(showAllProps => (this.standoffLinks.length > 0 ? true : showAllProps))
    );
  }

  trackByPropertyInfoFn = (index: number, item: PropertyInfoValues) => `${index}-${item.propDef.id}`;
  protected readonly cardinality = Cardinality;
}
