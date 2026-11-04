import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { injectDataModelEditing } from './data-model-editor';
import { familyColors } from './islands';
import { localNameOf } from './ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from './ontology-map-page.component';
import { ResourceClassPanelComponent } from './resource-class-panel.component';

export interface ResourceClassDialogData {
  /** The class to describe first. */
  classIri: string;
}

/** How the dialog opens: a drawer over the right of the page, as wide as the class panel beside the graph. */
export const resourceClassDialogConfig = (data: ResourceClassDialogData): MatDialogConfig<ResourceClassDialogData> => ({
  data,
  width: '440px',
  maxWidth: '100vw',
  height: '100vh',
  position: { right: '0' },
  panelClass: 'resource-class-dialog',
  autoFocus: false,
});

/**
 * The class panel of the Data models 2 pages, opened over another page such as the Data tab: a class clicked in it is
 * described instead, Browse opens it in the Data tab, Filter in the graph, Edit in the data model editor's dialogs.
 */
@Component({
  selector: 'app-resource-class-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourceClassPanelComponent, TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @if (graph(); as graph) {
      <app-resource-class-panel
        class="panel"
        [graph]="graph"
        [classIri]="classIri()"
        [anyResourceLabel]="t + '.anyResource' | translate"
        [subclassLabel]="t + '.subclassOf' | translate"
        [canEdit]="canEdit()"
        [colors]="colors()"
        (classSelected)="classIri.set($event)"
        (closed)="close()"
        (browse)="browse($event)"
        (filter)="filterOn($event)"
        (edit)="editing.editClass($event)"
        (editProperty)="editing.editProperty($event)" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .panel {
        height: 100%;
      }
    `,
  ],
})
export class ResourceClassDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<ResourceClassDialogComponent>);
  private readonly _router = inject(Router);
  private readonly _project = inject(ProjectPageService);
  readonly editing = injectDataModelEditing();

  /** The class described, which changes as linked classes are clicked. */
  readonly classIri = signal(inject<ResourceClassDialogData>(MAT_DIALOG_DATA).classIri);

  private readonly _graphs = toSignal(inject(DataModelGraphService).graphs$);
  /** The data model of the class described. */
  readonly graph = computed(() =>
    [...(this._graphs()?.values() ?? [])].find(graph =>
      graph.nodes.some(node => node.kind === 'class' && node.id === this.classIri())
    )
  );
  readonly colors = computed(() => {
    const graph = this.graph();
    return graph ? familyColors(graph) : new Map<string, string>();
  });
  readonly canEdit = toSignal(this._project.hasProjectAdminRights$, { initialValue: false });

  close(): void {
    this._dialogRef.close();
  }

  /** Opens the class in the Data tab. */
  browse(iri: string): void {
    const [ontologyIri, className] = iri.split('#');
    this._router.navigate(
      this._path(RouteConstants.data, OntologyService.getOntologyNameFromIri(ontologyIri), className)
    );
    this.close();
  }

  /** Shows the class with the classes it is linked with, in the graph. */
  filterOn(iri: string): void {
    const [ontologyIri] = iri.split('#');
    this._router.navigate(this._path(RouteConstants.dataModels2, RouteConstants.graph), {
      queryParams: {
        [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri),
        [ONTOLOGY_MAP_PARAM.filter]: localNameOf(iri),
      },
    });
    this.close();
  }

  private _path(...segments: string[]): string[] {
    return ['/', RouteConstants.project, this._project.currentProjectUuid, ...segments];
  }
}
