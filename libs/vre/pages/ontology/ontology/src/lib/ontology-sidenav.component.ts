import { Component, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import {
  DefaultClass,
  DefaultProperties,
  DefaultProperty,
  DefaultResourceClasses,
  PropertyCategory,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { EditPropertyFormDialogComponent } from './forms/property-form/edit-property-form-dialog.component';
import { CreatePropertyDialogData } from './forms/property-form/property-form.type';
import { CreateResourceClassDialogComponent } from './forms/resource-class-form/create-resource-class-dialog.component';
import { OntologyPageService } from './ontology-page.service';

@Component({
  selector: 'app-ontology-sidenav',
  template: `
    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
      <a
        mat-tab-link
        routerLink="./{{ RouteConstants.classes }}"
        routerLinkActive
        #rla1="routerLinkActive"
        [active]="rla1.isActive">
        Classes
      </a>
      <a
        mat-tab-link
        routerLink="./{{ RouteConstants.properties }}"
        routerLinkActive
        #rla2="routerLinkActive"
        [active]="rla2.isActive">
        Properties
      </a>
    </nav>
    <mat-divider />
    <mat-tab-nav-panel #tabPanel>
      <div *ngIf="rla1.isActive">
        <!-- Classes tab content -->
        <button mat-button (click)="ops.toggleExpandClasses()">
          <mat-icon>{{ (ops.expandClasses$ | async) ? 'compress' : 'expand' }}</mat-icon>
          {{ (ops.expandClasses$ | async) ? 'Collapse all' : 'Expand all' }}
        </button>
        <button
          *ngIf="hasProjectAdminRights$ | async"
          [disabled]="!(project$ | async)?.status"
          mat-button
          data-cy="create-class-button"
          [matMenuTriggerFor]="addResClassMenu">
          <mat-icon>add</mat-icon>
          Create new class
        </button>
        <mat-menu #addResClassMenu="matMenu" xPosition="before">
          <button
            [disabled]="!(project$ | async)?.status"
            [attr.data-cy]="type.iri.split('#').pop()"
            mat-menu-item
            *ngFor="let type of defaultClasses; trackBy: trackByDefaultClassFn"
            (click)="openCreateResourceClass(type)">
            <mat-icon>{{ type.icon }}</mat-icon>
            {{ type.label }}
          </button>
        </mat-menu>
      </div>

      <div *ngIf="rla2.isActive">
        <!-- Properties tab content -->
        <button
          *ngIf="hasProjectAdminRights$ | async"
          mat-button
          data-cy="create-property-button"
          [disabled]="!(project$ | async)?.status"
          [matMenuTriggerFor]="newFromPropType">
          <mat-icon>add</mat-icon>
          Add Property
        </button>
        <mat-menu #newFromPropType="matMenu">
          <ng-container *ngFor="let type of defaultProperties; trackBy: trackByPropCategoryFn">
            <button mat-menu-item [matMenuTriggerFor]="sub_menu" [attr.data-cy]="type.group">
              {{ type.group }}
            </button>
            <mat-menu #sub_menu="matMenu" class="default-nested-sub-menu">
              <button
                mat-menu-item
                *ngFor="let ele of type.elements; trackBy: trackByDefaultPropertyFn"
                [value]="ele"
                [attr.data-cy]="ele.label"
                [matTooltip]="ele.description"
                matTooltipPosition="after"
                (click)="openCreateNewProperty(ele)">
                <mat-icon>{{ ele.icon }}</mat-icon>
                {{ ele.label }}
              </button>
            </mat-menu>
          </ng-container>
        </mat-menu>
      </div>
    </mat-tab-nav-panel>
  `,
  styles: [
    `
      button {
        width: 100%;
        text-align: left;
        display: inline-block;
      }

      button:hover {
        background: var(--element-active-hover);
      }
    `,
  ],
})
export class OntologySidenavComponent {
  project$ = this._projectPageService.currentProject$;
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  readonly defaultClasses: DefaultClass[] = DefaultResourceClasses.data;
  readonly defaultProperties: PropertyCategory[] = DefaultProperties.data;

  constructor(
    public ops: OntologyPageService,
    private _projectPageService: ProjectPageService,
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef
  ) {}

  openCreateResourceClass(defaultClass: DefaultClass) {
    this._dialog.open<CreateResourceClassDialogComponent, DefaultClass>(CreateResourceClassDialogComponent, {
      ...DspDialogConfig.mediumDialog(defaultClass),
      viewContainerRef: this._viewContainerRef,
    });
  }

  openCreateNewProperty(propType: DefaultProperty) {
    this._dialog.open<EditPropertyFormDialogComponent, CreatePropertyDialogData>(EditPropertyFormDialogComponent, {
      data: { propType },
      viewContainerRef: this._viewContainerRef,
    });
  }

  trackByPropCategoryFn = (index: number, item: PropertyCategory) => `${index}-${item.group}`;
  trackByDefaultPropertyFn = (index: number, item: DefaultProperty) => `${index}-${item.label}`;
  trackByDefaultClassFn = (index: number, item: DefaultClass) => `${index}-${item.iri}`;
  protected readonly RouteConstants = RouteConstants;
}
