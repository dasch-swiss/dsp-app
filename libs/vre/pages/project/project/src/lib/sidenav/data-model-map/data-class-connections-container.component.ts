import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { navigateToResourceClass } from '../resource-class-sidenav/resource-class-route';
import { DataClassConnectionsComponent } from './data-class-connections.component';
import { DataModelGraphService } from './data-model-graph.service';

/** The connections strip of the class shown in the class view, fed from its data model's graph. */
@Component({
  selector: 'app-data-class-connections-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataClassConnectionsComponent, TranslatePipe],
  template: `
    @if (graph(); as graph) {
      <app-data-class-connections
        [graph]="graph"
        [classIri]="classIri()"
        [anyResourceLabel]="'pages.dataBrowser.dataModelMap.anyResource' | translate"
        [subclassLabel]="'pages.dataBrowser.dataModelMap.subclassOf' | translate"
        (classSelected)="open($event)" />
    }
  `,
})
export class DataClassConnectionsContainerComponent {
  /** IRI of the class shown in the class view. */
  readonly classIri = input.required<string>();

  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _graphs = inject(DataModelGraphService);

  readonly graph = toSignal(toObservable(this.classIri).pipe(switchMap(iri => this._graphs.graphOfClass$(iri))));

  /** The class view's route is a child of the data browser's, which class paths are relative to. */
  open(iri: string): void {
    navigateToResourceClass(this._router, this._route.parent ?? this._route, iri);
  }
}
