import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo, OntologyMetadata } from '@dasch-swiss/dsp-js';
import {
  AppConfigService,
  RouteConstants,
} from '@dasch-swiss/vre/shared/app-config';
import {
  OntologyService,
  ProjectService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import {
  ListsSelectors,
  OntologiesSelectors,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProjectBase } from '../project-base';

// the routes available for navigation
type DataModelRoute =
  | typeof RouteConstants.ontology
  | typeof RouteConstants.addOntology
  | typeof RouteConstants.list
  | typeof RouteConstants.addList
  | 'docs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-data-models',
  templateUrl: './data-models.component.html',
  styleUrls: ['./data-models.component.scss'],
})
export class DataModelsComponent extends ProjectBase implements OnInit {
  get ontologiesMetadata$(): Observable<OntologyMetadata[]> {
    const uuid = this._route.parent.snapshot.params.uuid;
    const iri = `${this._appInit.dspAppConfig.iriBase}/projects/${uuid}`;
    if (!uuid) {
      return of({} as OntologyMetadata[]);
    }

    return this._store.select(OntologiesSelectors.projectOntologies).pipe(
      map(ontologies => {
        if (!ontologies || !ontologies[iri]) {
          return [];
        }

        return ontologies[iri].ontologiesMetadata;
      })
    );
  }

  @Select(UserSelectors.isLoggedIn) isLoggedIn$: Observable<boolean>;
  @Select(OntologiesSelectors.isLoading) isLoading$: Observable<boolean>;
  @Select(ListsSelectors.listsInProject) listsInProject$: Observable<
    ListNodeInfo[]
  >;

  constructor(
    protected _route: ActivatedRoute,
    protected _router: Router,
    protected _appInit: AppConfigService,
    protected _store: Store,
    protected _projectService: ProjectService,
    protected _titleService: Title,
    protected _cd: ChangeDetectorRef,
    protected _actions$: Actions
  ) {
    super(
      _store,
      _route,
      _projectService,
      _titleService,
      _router,
      _cd,
      _actions$
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  trackByFn = (index: number, item: ListNodeInfo) => `${index}-${item.id}`;

  trackByOntologyMetaFn = (index: number, item: OntologyMetadata) =>
    `${index}-${item.id}`;

  /**
   * handles routing to the correct path
   * @param route path to route to
   * @param id optional ontology id or list id
   */
  open(route: DataModelRoute, id?: string) {
    if (route === RouteConstants.ontology && id) {
      // get name of ontology
      const ontoName = OntologyService.getOntologyName(id);
      this._router.navigate(
        [
          route,
          encodeURIComponent(ontoName),
          RouteConstants.editor,
          RouteConstants.classes,
        ],
        { relativeTo: this._route.parent }
      );
      return;
    }
    if (route === RouteConstants.list && id) {
      const listName = id.split('/').pop();
      // route to the list editor
      this._router.navigate([route, encodeURIComponent(listName)], {
        relativeTo: this._route.parent,
      });
      return;
    } else if (route === 'docs') {
      // route to the external docs
      window.open(
        'https://docs.dasch.swiss/latest/DSP-APP/user-guide/project/#data-model',
        '_blank'
      );
      return;
    } else {
      // default routing
      this._router.navigate([route], { relativeTo: this._route.parent });
    }
  }
}
