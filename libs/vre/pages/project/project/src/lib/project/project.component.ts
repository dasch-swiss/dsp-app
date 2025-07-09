import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ReadOntology } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import {
  LoadProjectOntologiesAction,
  LoadProjectsAction,
  OntologiesSelectors,
  ProjectsSelectors,
} from '@dasch-swiss/vre/core/state';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, take, takeUntil, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  projectUuid$: Observable<string> = this._route.params.pipe(map(params => params[RouteConstants.uuidParameter]));
  isProjectsLoading$ = this._store.select(ProjectsSelectors.isProjectsLoading);
  hasLoadingErrors$ = this._store.select(OntologiesSelectors.hasLoadingErrors);
  currentProject$ = this._store.select(ProjectsSelectors.currentProject);
  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  routeConstants = RouteConstants;

  sideNavOpened = true;
  currentOntologyName: undefined | string;

  projectOntologies$: Observable<ReadOntology[]> = this._store.select(OntologiesSelectors.currentProjectOntologies);

  activeForDataModels$ = this._router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const url = this._router.url;
      return (
        url.includes(RouteConstants.dataModels) ||
        url.includes(RouteConstants.ontology) ||
        url.includes(RouteConstants.list)
      );
    })
  );

  destroyed: Subject<void> = new Subject<void>();

  protected readonly RouteConstants = RouteConstants;

  constructor(
    protected _actions$: Actions,
    private _router: Router,
    protected _store: Store,
    protected _route: ActivatedRoute,
    private _titleService: Title,
    protected projectService: ProjectService
  ) {}

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const element = event.target as HTMLElement;
    if (event.key === '[' && !element.matches('input, textarea')) {
      this.toggleSidenav();
    }
  }

  ngOnInit() {
    this._router.events
      .pipe(
        takeUntil(this.destroyed),
        filter(e => e instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => {
        this.currentOntologyName = this.getParamFromRouteTree('onto');
      });

    this.projectUuid$.pipe(distinctUntilChanged(), takeUntil(this.destroyed)).subscribe(uuid => {
      this._loadProject(uuid);
    });

    this._store
      .select(ProjectsSelectors.currentProject)
      .pipe(distinctUntilChanged(), takeUntil(this.destroyed))
      .subscribe(project => {
        if (project) {
          this._titleService.setTitle(project.shortname);
        }
      });
  }

  private getParamFromRouteTree(param: string): string | undefined {
    let route = this._router.routerState.root;
    while (route) {
      if (route.snapshot.paramMap.has(param)) {
        return route.snapshot.paramMap.get(param) || undefined;
      }
      route = route.firstChild!;
    }
    return undefined;
  }

  private _loadProject(projectUuid: string): void {
    this.isProjectsLoading$
      .pipe(takeWhile(isLoading => !isLoading && !!projectUuid))
      .pipe(take(1))
      .subscribe({
        next: () => {
          const project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
          const projectIri = this.projectService.uuidToIri(projectUuid);
          if (!project || project.id !== projectIri) {
            // get current project data, project members and project groups
            // and set the project state here
            this._actions$
              .pipe(ofActionSuccessful(LoadProjectsAction))
              .pipe(take(1))
              .subscribe(() => this.setProjectData());
            this._store.dispatch([new LoadProjectsAction()]);
          } else {
            this._store.dispatch(new LoadProjectOntologiesAction(projectUuid));
          }
        },
      });
  }

  private setProjectData(): void {
    const project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
    if (!project) {
      return;
    }

    this._titleService.setTitle(project.shortname);
    this._store.dispatch(new LoadProjectOntologiesAction(project.id, this.currentOntologyName));
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  trackByFn = (index: number, item: ReadOntology) => `${index}-${item.id}`;

  compareElementHeights(elem: HTMLElement): boolean {
    return !(elem.scrollHeight > elem.clientHeight);
  }

  toggleSidenav() {
    this.sideNavOpened = !this.sideNavOpened;
    this.sidenav.toggle();
  }
}
