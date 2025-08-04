import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo, ListResponse, OntologyMetadata } from '@dasch-swiss/dsp-js';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import {
  ListsSelectors,
  LoadListsInProjectAction,
  OntologiesSelectors,
  ProjectsSelectors,
} from '@dasch-swiss/vre/core/state';
import { ListInfoFormComponent } from '@dasch-swiss/vre/pages/ontology/list';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { take } from 'rxjs';
import { OntologyFormComponent } from '../forms/ontology-form/ontology-form.component';

@Component({
  selector: 'app-data-models',
  templateUrl: './data-models.component.html',
  styleUrls: ['./data-models.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataModelsComponent {
  protected readonly RouteConstants = RouteConstants;

  ontologiesMetadata$ = this._store.select(OntologiesSelectors.currentProjectOntologyMetadata);
  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);
  isLoading$ = this._store.select(OntologiesSelectors.isLoading);
  listsInProject$ = this._store.select(ListsSelectors.listsInProject);

  constructor(
    private _dialog: MatDialog,
    public _route: ActivatedRoute,
    private _router: Router,
    private _store: Store
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
    const dialogRef = this._dialog.open<OntologyFormComponent>(
      OntologyFormComponent,
      DspDialogConfig.dialogDrawerConfig(null, true)
    );
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(o => this.navigateToOntology(o.id));
  }

  createNewList() {
    const dialogRef = this._dialog.open<ListInfoFormComponent, null>(
      ListInfoFormComponent,
      DspDialogConfig.dialogDrawerConfig(null, true)
    );
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((response: ListResponse) => {
        const projectIri = this._store.selectSnapshot(ProjectsSelectors.currentProject)!.id;
        this._store.dispatch(new LoadListsInProjectAction(projectIri!));
        this.navigateToList(response.list.listinfo.id);
      });
  }
}
