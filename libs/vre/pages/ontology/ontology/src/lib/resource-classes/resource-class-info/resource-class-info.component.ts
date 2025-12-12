import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatList } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { ApiResponseError, CanDoResponse, IHasProperty, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { DialogService, TruncatePipe } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, switchMap, take } from 'rxjs';
import {
  EditResourceClassDialogComponent,
  EditResourceClassDialogProps,
} from '../../forms/resource-class-form/edit-resource-class-dialog.component';
import { OntologyPageService } from '../../ontology-page.service';
import { ClassPropertyInfo, ResourceClassInfo } from '../../ontology.types';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { AddPropertyMenuComponent } from './add-property-menu.component';
import { PropertyItemComponent } from './property-item.component';

@Component({
  selector: 'app-resource-class-info',
  templateUrl: './resource-class-info.component.html',
  styleUrls: ['./resource-class-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AddPropertyMenuComponent,
    AsyncPipe,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatIcon,
    MatIconButton,
    MatList,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
    PropertyItemComponent,
    StringifyStringLiteralPipe,
    TranslateModule,
    TruncatePipe,
  ],
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

  protected readonly _translate = inject(TranslateService);

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private _viewContainerRef: ViewContainerRef,
    private readonly _cd: ChangeDetectorRef,
    private readonly _clipboard: Clipboard,
    private readonly _dialog: MatDialog,
    private readonly _dialogService: DialogService,
    private readonly _notification: NotificationService,
    private readonly _oes: OntologyEditService,
    private readonly _projectPageService: ProjectPageService,
    public ops: OntologyPageService
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
      {
        ...DspDialogConfig.mediumDialog({
          labels: this.resourceClass.labels,
          data: this.resourceClass.updateResourceClassData,
        }),
        viewContainerRef: this._viewContainerRef,
      }
    );
  }

  deleteResourceClass() {
    this._dialogService
      .afterConfirmation(this._translate.instant('pages.ontology.resourceClassInfo.deleteConfirmation'))
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
    const projectUuid = this._projectPageService.currentProjectUuid;
    const ontologyName = OntologyService.getOntologyNameFromIri(this._oes.ontologyId || '');
    const dataBrowserRoute = `/${RouteConstants.project}/${projectUuid}/${RouteConstants.data}/${ontologyName}/${this.resourceClass.name}`;
    window.open(dataBrowserRoute, '_blank');
  }

  copyResourceClassId() {
    this._clipboard.copy(this.resourceClass.id);
    this._notification.openSnackBar(this._translate.instant('pages.ontology.resourceClassInfo.idCopied'));
  }

  private _canDeleteResourceClass$(classId: string): Observable<CanDoResponse | ApiResponseError> {
    return this._dspApiConnection.v2.onto.canDeleteResourceClass(classId);
  }
}
