import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ApiResponseError, CanDoResponse, IHasProperty, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { Observable, Subscription, switchMap, take } from 'rxjs';
import {
  EditResourceClassDialogComponent,
  EditResourceClassDialogProps,
} from '../../forms/resource-class-form/edit-resource-class-dialog.component';
import { OntologyPageService } from '../../ontology-page.service';
import { ClassPropertyInfo, ResourceClassInfo } from '../../ontology.types';
import { OntologyEditService } from '../../services/ontology-edit.service';

@Component({
  selector: 'app-resource-class-info',
  templateUrl: './resource-class-info.component.html',
  styleUrls: ['./resource-class-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassInfoComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resourceClass!: ResourceClassInfo;

  project$ = this._projectPageService.currentProject$;

  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  classHovered = false;
  menuOpen = false;

  classCanBeDeleted = false;
  subscription!: Subscription;
  expandClasses = true;

  trackByPropToDisplayFn = (index: number, item: ClassPropertyInfo) => `${index}-${item.propDef.id}`;

  constructor(
    public ops: OntologyPageService,
    private _cd: ChangeDetectorRef,
    private _clipboard: Clipboard,
    private _dialog: MatDialog,
    private _dialogService: DialogService,
    private _notification: NotificationService,
    private _oes: OntologyEditService,
    private _projectPageService: ProjectPageService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.subscription = this.ops.expandClasses$.subscribe(expandClasses => {
      this.expandClasses = expandClasses;
      this._cd.detectChanges();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  setCanBeDeleted() {
    this._canDeleteResourceClass$(this.resourceClass.id)
      .pipe(take(1))
      .subscribe(response => {
        if (response instanceof ApiResponseError) {
          return;
        }
        this.classCanBeDeleted = response?.canDo;
      });
  }

  editResourceClassInfo() {
    this._dialog.open<EditResourceClassDialogComponent, EditResourceClassDialogProps>(
      EditResourceClassDialogComponent,
      DspDialogConfig.mediumDialog({
        labels: this.resourceClass.labels,
        data: this.resourceClass.updateResourceClassData,
      })
    );
  }

  deleteResourceClass() {
    this._dialogService
      .afterConfirmation('Do you want to delete this resource class ?')
      .pipe(switchMap(_del => this._oes.deleteResourceClass$(this.resourceClass.id)))
      .subscribe();
  }

  onPropertyDropped(event: CdkDragDrop<ClassPropertyInfo[]>) {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(this.resourceClass.properties, event.previousIndex, event.currentIndex);
    const updated = this.resourceClass.properties.map((p, index) => ({
      ...p.iHasProperty,
      guiOrder: index + 1,
    }));

    this._oes.updateGuiOrderOfClassProperties(this.resourceClass.id, updated);
  }

  onCardinalityChange(updatedIHasProperty: IHasProperty) {
    const properties: IHasProperty[] = this.resourceClass.properties.map(p => p.iHasProperty);
    properties.map(p => (p.propertyIndex === updatedIHasProperty.propertyIndex ? { ...p, ...updatedIHasProperty } : p));
    this._oes.updatePropertiesOfResourceClass(this.resourceClass.id, properties);
  }

  openInDatabrowser() {
    const projectUuid = this._route.snapshot.params[RouteConstants.uuidParameter];

    const ontologyName = OntologyService.getOntologyNameFromIri(this._oes.ontologyId || '');
    const dataBrowserRoute = `/${RouteConstants.project}/${projectUuid}/${RouteConstants.ontology}/${ontologyName}/${this.resourceClass.name}`;
    window.open(dataBrowserRoute, '_blank');
  }

  copyResourceClassId() {
    this._clipboard.copy(this.resourceClass.id);
    this._notification.openSnackBar('Resource class ID copied to clipboard.');
  }

  private _canDeleteResourceClass$(classId: string): Observable<CanDoResponse | ApiResponseError> {
    return this._dspApiConnection.v2.onto.canDeleteResourceClass(classId);
  }
}
