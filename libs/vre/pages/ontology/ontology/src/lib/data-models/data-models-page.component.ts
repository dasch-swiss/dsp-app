import { ChangeDetectionStrategy, Component, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo, OntologyMetadata } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ListInfoFormComponent } from '@dasch-swiss/vre/pages/ontology/list';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { map, switchMap } from 'rxjs';
import { CreateOntologyFormDialogComponent } from '../forms/ontology-form/create-ontology-form-dialog.component';

@Component({
  selector: 'app-data-models-page',
  templateUrl: './data-models-page.component.html',
  styleUrls: ['./data-models-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataModelsPageComponent {
  protected readonly RouteConstants = RouteConstants;

  ontologiesMetadata$ = this._projectPageService.ontologiesMetadata$;
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;
  listsInProject$ = this._projectPageService.currentProject$.pipe(
    switchMap(project => this._listApiService.listInProject(project.id)),
    map(response => response.lists)
  );

  constructor(
    private _dialog: MatDialog,
    private _projectPageService: ProjectPageService,
    private _listApiService: ListApiService,
    private _viewContainerRef: ViewContainerRef,
    public _route: ActivatedRoute,
    private _router: Router
  ) {}

  trackByFn = (index: number, item: ListNodeInfo) => `${index}-${item.id}`;

  trackByOntologyMetaFn = (index: number, item: OntologyMetadata) => `${index}-${item.id}`;

  navigateToList(id: string) {
    const listName = id.split('/').pop();
    this._router.navigate([RouteConstants.list, encodeURIComponent(listName)], {
      relativeTo: this._route.parent,
    });
  }

  navigateToOntology(id: string) {
    const ontoName = OntologyService.getOntologyNameFromIri(id);
    this._router.navigate(
      [RouteConstants.ontology, encodeURIComponent(ontoName), RouteConstants.editor, RouteConstants.classes],
      {
        relativeTo: this._route.parent,
      }
    );
  }

  createNewOntology() {
    this._dialog
      .open<CreateOntologyFormDialogComponent>(CreateOntologyFormDialogComponent, {
        ...DspDialogConfig.dialogDrawerConfig(null, true),
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(o => {
        if (o) {
          this.navigateToOntology(o.id);
        }
      });
  }

  createNewList() {
    this._dialog
      .open<ListInfoFormComponent, null>(ListInfoFormComponent, {
        ...DspDialogConfig.dialogDrawerConfig(null, true),
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(response => {
        this.navigateToList(response.list.listinfo.id);
      });
  }
}
