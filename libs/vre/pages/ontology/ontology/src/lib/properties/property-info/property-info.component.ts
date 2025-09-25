import { ChangeDetectionStrategy, Component, Input, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultProperty } from '@dasch-swiss/vre/shared/app-helper-services';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { BehaviorSubject, map, startWith, switchMap } from 'rxjs';
import { EditPropertyFormDialogComponent } from '../../forms/property-form/edit-property-form-dialog.component';
import { EditPropertyDialogData } from '../../forms/property-form/property-form.type';
import { ClassShortInfo, PropertyInfo } from '../../ontology.types';
import { OntologyEditService } from '../../services/ontology-edit.service';

@Component({
  selector: 'app-property-info',
  templateUrl: './property-info.component.html',
  styleUrls: ['./property-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PropertyInfoComponent {
  @Input({ required: true }) property!: PropertyInfo;

  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  showActionBubble = false;

  readonly canBeDeletedTrigger$ = new BehaviorSubject<void>(undefined);

  readonly canBeDeleted$ = this.canBeDeletedTrigger$.asObservable().pipe(
    switchMap(() => this._oes.canDeleteResourceProperty$(this.property.propDef!.id)),
    map(res => res.canDo),
    startWith(false)
  );

  isLockHovered = false;
  project$ = this._projectPageService.currentProject$;
  constructor(
    private _dialog: MatDialog,
    private _oes: OntologyEditService,
    private _dialogService: DialogService,
    private _projectPageService: ProjectPageService,
    private _viewContainerRef: ViewContainerRef
  ) {}

  openEditProperty(propDef: ResourcePropertyDefinitionWithAllLanguages, propType: DefaultProperty) {
    const propertyData: EditPropertyDialogData = {
      id: propDef.id,
      propType,
      name: propDef.id?.split('#').pop() || '',
      label: propDef.labels,
      comment: propDef.comments,
      guiElement: propDef.guiElement || propType.guiElement,
      guiAttribute: propDef.guiAttributes[0],
      objectType: propDef.objectType,
    };
    this._dialog.open<EditPropertyFormDialogComponent, EditPropertyDialogData>(EditPropertyFormDialogComponent, {
      viewContainerRef: this._viewContainerRef,
      ...DspDialogConfig.dialogDrawerConfig(propertyData),
    });
  }

  openDeleteProperty(id: string) {
    this._dialogService
      .afterConfirmation('Do you want to delete this resource class ?')
      .pipe(switchMap(_del => this._oes.deleteProperty$(id)))
      .subscribe();
  }

  trackByFn = (index: number, item: ClassShortInfo) => item.id;

  mouseEnter() {
    if (this._oes.isTransacting) {
      return;
    }
    this.showActionBubble = true;
    this.canBeDeletedTrigger$.next();
  }

  mouseLeave() {
    this.showActionBubble = false;
  }
}
