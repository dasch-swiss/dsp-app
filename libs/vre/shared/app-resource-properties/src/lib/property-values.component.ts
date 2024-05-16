import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Cardinality, ReadUser } from '@dasch-swiss/dsp-js';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-property-values',
  template: ` <div
      *ngFor="let group of propertyValueService.formArray.controls; let index = index"
      style="display: flex">
      <app-property-value style="width: 100%" [itemTpl]="itemTpl" [index]="index"></app-property-value>
    </div>
    <button
      mat-icon-button
      (click)="addItem()"
      *ngIf="
        (isAdmin$ | async) &&
        (!propertyValueService.currentlyAdding || propertyValueService.keepEditMode) &&
        (propertyValueService.formArray.controls.length === 0 ||
          [Cardinality._0_n, Cardinality._1_n].includes(propertyValueService.cardinality)) &&
        propertyValueService.propertyDefinition.isEditable
      ">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px">add_box</mat-icon>
    </button>`,
})
export class PropertyValuesComponent implements OnInit {
  @Input() itemTpl!: TemplateRef<any>;

  // TODO: this is copy pasted from ProjectBase: this needs to be in StateManagement (not project base)
  isAdmin$ = combineLatest([
    this._store.select(UserSelectors.user).pipe(filter(user => user !== null)) as Observable<ReadUser>,
    this._store.select(UserSelectors.userProjectAdminGroups),
    this._route.params,
    this._route.parent!.params,
  ]).pipe(
    map(([user, userProjectGroups, params, parentParams]) => {
      // TODO this can lead to many bugs: params depend on the routing, but this component can be used everywhere!!
      // TODO this needs to change, probably the StateManagement + Routing needs to be reviewed.
      const uuid = ((_params: Params, _parentParams: Params) => {
        if (_params['uuid']) {
          return _params['uuid'];
        }
        if (_parentParams['uuid']) {
          return _parentParams['uuid'];
        }
        if (_params['project']) {
          return _params['project'];
        }
        throw new Error('Project uuid param not found');
      })(params, parentParams);
      const projectIri = this._projectService.uuidToIri(uuid);
      return ProjectService.IsProjectAdminOrSysAdmin(user, userProjectGroups, projectIri);
    })
  );

  protected readonly Cardinality = Cardinality;

  constructor(
    public propertyValueService: PropertyValueService,
    private _fb: FormBuilder,
    private _store: Store,
    private _route: ActivatedRoute,
    private _projectService: ProjectService
  ) {}

  ngOnInit() {
    if (!this.propertyValueService.formArray) {
      throw new Error('The form array should not be empty.');
    }
  }

  addItem() {
    this.propertyValueService.formArray.push(
      this._fb.group({
        item: propertiesTypeMapping
          .get(this.propertyValueService.propertyDefinition.objectType!)!
          .control() as AbstractControl,
        comment: this._fb.control(''),
      })
    );
    this.propertyValueService.toggleOpenedValue(this.propertyValueService.formArray.length - 1);
    this.propertyValueService.currentlyAdding = true;
  }
}
