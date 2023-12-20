import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadOntology, ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { ClassAndPropertyDefinitions } from '@dasch-swiss/dsp-js/src/models/v2/ontologies/ClassAndPropertyDefinitions';
import { MaterialColor, RouteConstants, getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors, ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store } from '@ngxs/store';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ComponentCommunicationEventService, Events } from '../main/services/component-communication-event.service';
import { ProjectBase } from './project-base';

type AvailableRoute =
  | typeof RouteConstants.project
  | typeof RouteConstants.settings
  | typeof RouteConstants.dataModels
  | typeof RouteConstants.advancedSearch;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})
export class ProjectComponent extends ProjectBase implements OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;

  routeConstants = RouteConstants;

  listItemSelected = '';

  getAllEntityDefinitionsAsArray = getAllEntityDefinitionsAsArray;
  componentCommsSubscription: Subscription;
  classAndPropertyDefinitions: ClassAndPropertyDefinitions;

  sideNavOpened = true;

  // routes for sidenav
  projectRoute: AvailableRoute = RouteConstants.project;
  settingsRoute: AvailableRoute = RouteConstants.settings;
  dataModelsRoute: AvailableRoute = RouteConstants.dataModels;
  advancedSearchRoute: AvailableRoute = RouteConstants.advancedSearch;

  get isMember$(): Observable<boolean> {
    return combineLatest([this.user$, this.userProjectAdminGroups$]).pipe(
      map(([user, userProjectAdminGroups]) =>
        ProjectService.IsProjectMember(user, userProjectAdminGroups, this.projectUuid)
      )
    );
  }

  get color$(): Observable<string> {
    return this.readProject$.pipe(
      map(readProject => (!readProject.status ? MaterialColor.Warn : MaterialColor.Primary))
    );
  }

  get readProject$(): Observable<ReadProject> {
    if (!this.projectUuid) {
      return of({} as ReadProject);
    }

    return this.readProjects$.pipe(
      take(1),
      map(projects => this.getCurrentProject(projects))
    );
  }

  get projectOntologies$(): Observable<ReadOntology[]> {
    if (!this.projectUuid) {
      return of({} as ReadOntology[]);
    }

    return this._store.select(OntologiesSelectors.projectOntologies).pipe(
      map(ontologies => {
        const projectIri = this._projectService.uuidToIri(this.projectUuid);
        if (!ontologies || !ontologies[projectIri]) {
          return [];
        }

        return ontologies[projectIri].readOntologies;
      })
    );
  }

  get isLoading$(): Observable<boolean> {
    return combineLatest([this.isOntologiesLoading$, this.isProjectsLoading$]).pipe(
      map(([isOntologiesLoading, isProjectsLoading]) => isOntologiesLoading === true || isProjectsLoading === true)
    );
  }

  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.userProjects) userProjects$: Observable<ReadUser>;
  @Select(ProjectsSelectors.readProjects) readProjects$: Observable<ReadProject[]>;
  @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
  @Select(OntologiesSelectors.isLoading) isOntologiesLoading$: Observable<boolean>;
  @Select(OntologiesSelectors.hasLoadingErrors) hasLoadingErrors$: Observable<boolean>;

  constructor(
    private _componentCommsService: ComponentCommunicationEventService,
    protected _cd: ChangeDetectorRef,
    protected _actions$: Actions,
    protected _router: Router,
    protected _store: Store,
    protected _route: ActivatedRoute,
    _titleService: Title,
    _projectService: ProjectService
  ) {
    super(_store, _route, _projectService, _titleService, _router, _cd, _actions$);
  }

  /**
   * add keyboard support to expand/collapse sidenav
   * @param event automatically passed whenever the user types
   */
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const element = event.target as HTMLElement;
    if (event.key === '[' && !element.matches('input, textarea')) {
      this.toggleSidenav();
    }
  }

  ngOnInit() {
    super.ngOnInit();
    switch (this._router.url) {
      case `${RouteConstants.project}/${this.projectUuid}/${RouteConstants.advancedSearch}`: {
        this.listItemSelected = RouteConstants.advancedSearch;
        break;
      }
      case `${RouteConstants.project}/${this.projectUuid}`: {
        this.listItemSelected = this._router.url;
        break;
      }
      case `${RouteConstants.project}/${this.projectUuid}/${RouteConstants.dataModels}`: {
        this.listItemSelected = RouteConstants.dataModels;
        break;
      }
      case `${RouteConstants.project}/${this.projectUuid}/${RouteConstants.settings}/${RouteConstants.collaboration}`: {
        this.listItemSelected = RouteConstants.settings;
        break;
      }
    }

    this.componentCommsSubscription = this._componentCommsService.on(Events.unselectedListItem, () => {
      this.listItemSelected = '';
    });
  }

  ngOnDestroy() {
    // unsubscribe from the ValueOperationEventService when component is destroyed
    if (this.componentCommsSubscription !== undefined) {
      this.componentCommsSubscription.unsubscribe();
    }
  }

  trackByFn = (index: number, item: ReadOntology) => `${index}-${item.id}`;

  open(route: AvailableRoute, id = '') {
    const routeCommands = id ? [route, id] : [route];
    const extras = route === RouteConstants.project ? {} : { relativeTo: this._route };
    this.listItemSelected = `/${route}/${id}`;
    this._router.navigate(routeCommands, extras);
  }

  /**
   * given a Html element, compare the scrollHeight and the clientHeight
   *
   * @param elem the element which has the line-clamp css
   * @returns inverse of comparison between the scrollHeight and the clientHeight of elem
   */
  compareElementHeights(elem: HTMLElement): boolean {
    return !(elem.scrollHeight > elem.clientHeight);
  }

  /**
   * toggle sidenav
   */
  toggleSidenav() {
    this.sideNavOpened = !this.sideNavOpened;
    this.sidenav.toggle();
  }
}
