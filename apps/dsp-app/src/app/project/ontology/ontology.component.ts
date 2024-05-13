import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  ClassDefinition,
  Constants,
  KnoraApiConnection,
  PropertyDefinition,
  ReadOntology,
  ReadProject,
  ReadUser,
  ResourceClassDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-api';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import {
  DefaultClass,
  DefaultProperties,
  DefaultResourceClasses,
  OntologyService,
  ProjectService,
  PropertyCategory,
  PropertyInfoObject,
  SortingService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import {
  EditPropertyFormDialogComponent,
  EditPropertyFormDialogProps,
} from '@dasch-swiss/vre/shared/app-property-form';
import {
  ClearCurrentOntologyAction,
  ClearProjectOntologiesAction,
  CurrentOntologyCanBeDeletedAction,
  LoadListsInProjectAction,
  LoadOntologyAction,
  LoadProjectOntologiesAction,
  OntologiesSelectors,
  OntologyProperties,
  ProjectsSelectors,
  SetCurrentOntologyAction,
  SetCurrentProjectOntologyPropertiesAction,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, switchMap, take, takeUntil } from 'rxjs/operators';
import { DialogComponent } from '../../main/dialog/dialog.component';
import { DialogService } from '../../main/services/dialog.service';
import { ProjectBase } from '../project-base';
import {
  CreateResourceClassDialogComponent,
  CreateResourceClassDialogProps,
} from './create-resource-class-dialog/create-resource-class-dialog.component';
import {
  EditResourceClassDialogComponent,
  EditResourceClassDialogProps,
} from './edit-resource-class-dialog/edit-resource-class-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ontology',
  templateUrl: './ontology.component.html',
  styleUrls: ['./ontology.component.scss'],
})
export class OntologyComponent extends ProjectBase implements OnInit, OnDestroy {
  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.userProjectAdminGroups) userProjectAdminGroups$: Observable<string[]>;
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
  @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
  @Select(OntologiesSelectors.currentProjectOntologies) currentProjectOntologies$: Observable<ReadOntology[]>;
  @Select(OntologiesSelectors.currentOntologyCanBeDeleted) currentOntologyCanBeDeleted$: Observable<boolean>;
  isOntologiesLoading$ = this._store.select(OntologiesSelectors.isLoading);
  currentOntology$ = this._store.select(OntologiesSelectors.currentOntology);

  private ngUnsubscribe = new Subject<void>();

  // all resource classes in the current ontology
  ontoClasses: ClassDefinition[];
  // expand the resource class cards
  expandClasses = true;

  // all properties in the current ontology
  ontoProperties: OntologyProperties;

  // form to select ontology from list
  ontologyForm: UntypedFormGroup;

  // display resource classes as grid or as graph
  view: 'classes' | 'properties' | 'graph' = 'classes';

  // i18n setup; in the user interface we use the term
  // data model for ontology
  itemPluralMapping = {
    ontology: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 data model',
      other: '# data models',
    },
  };

  /**
   * list of all default resource classes (subclass of)
   */
  readonly defaultClasses: DefaultClass[] = DefaultResourceClasses.data;
  readonly defaultProperties: PropertyCategory[] = DefaultProperties.data;

  // disable content on small devices
  disableContent = false;

  // route to classes view
  readonly classesLink = `../${RouteConstants.classes}`;
  readonly propertiesLink = `../${RouteConstants.properties}`;

  updatePropertyAssignment$ = new Subject<void>();

  // the lastModificationDate is the most important key
  // when updating something inside the ontology
  lastModificationDate$ = this.currentOntology$.pipe(
    takeUntil(this.ngUnsubscribe),
    map(x => x?.lastModificationDate)
  );

  isLoading$ = combineLatest([this.isOntologiesLoading$, this.isProjectsLoading$]).pipe(
    takeUntil(this.ngUnsubscribe),
    map(([isOntologiesLoading, isProjectsLoading]) => isOntologiesLoading === true || isProjectsLoading === true)
  );

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _fb: UntypedFormBuilder,
    private _ontologyService: OntologyService,
    private _sortingService: SortingService,
    protected _actions$: Actions,
    protected _router: Router,
    protected _route: ActivatedRoute,
    protected _store: Store,
    protected _titleService: Title,
    protected _projectService: ProjectService,
    protected _cd: ChangeDetectorRef,
    private _dialogService: DialogService
  ) {
    super(_store, _route, _projectService, _titleService, _router, _cd, _actions$);
  }

  @HostListener('window:resize', ['$event']) onWindowResize() {
    this.disableContent = window.innerWidth <= 768;
    // reset the page title
    if (!this.disableContent) {
      this.setTitle();
    }
  }

  ngOnInit() {
    super.ngOnInit();
    // get the uuid of the current project
    this._route.parent.paramMap.subscribe((params: Params) => {
      this.projectUuid = params.get('uuid');
    });

    if (this._route.snapshot) {
      // get the selected view from route: display classes or properties view
      this.view = this._route.snapshot.params.view ? this._route.snapshot.params.view : RouteConstants.classes;
    }

    this._store
      .select(ProjectsSelectors.currentProject)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(project => {
        this.initProjectOntologies(project);
      });

    // TODO temporary solution to replace eventemitter with subject because emitter loses subscriber after child component
    // subscription responsible for emitting event is triggered
    this.updatePropertyAssignment$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.initOntologiesList();
    });

    this._cd.markForCheck();
  }

  private initProjectOntologies(currentProject: ReadProject) {
    if (!currentProject || !this.projectUuid || currentProject.id !== this.projectIri) {
      return;
    }

    const projectOntologies = this._store.selectSnapshot(OntologiesSelectors.projectOntologies);
    if (
      currentProject.ontologies.length > 0 &&
      (!projectOntologies[this.projectIri] || projectOntologies[this.projectIri].readOntologies.length === 0)
    ) {
      this._store.dispatch(new LoadProjectOntologiesAction(currentProject.id));
      this._actions$.pipe(ofActionSuccessful(LoadListsInProjectAction)).subscribe(() => {
        this.initOntology();
      });
    } else {
      this.initOntology();
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this._store.dispatch(new ClearCurrentOntologyAction());
  }

  private initView(ontology: ReadOntology): void {
    this.disableContent = window.innerWidth <= 768;

    // set the page title
    this.setTitle();
    // this.initOntologiesList();

    this.ontologyForm = this._fb.group({
      ontology: new UntypedFormControl({
        value: ontology.id,
        disabled: false,
      }),
    });

    this.ontologyForm.valueChanges.subscribe(val => {
      if (!this.ontologyForm) {
        return;
      }
      // reset and open selected ontology
      this.resetOntology(val.ontology);
    });
  }

  /**
   * build the list of project ontologies
   * and set the state of currentProjectOntologies
   */
  initOntologiesList(): void {
    this._store.dispatch(new LoadProjectOntologiesAction(this.projectUuid));
    combineLatest([
      this._actions$.pipe(ofActionSuccessful(LoadListsInProjectAction)),
      this.project$,
      this.currentProjectOntologies$,
    ])
      .pipe(
        take(1),
        map(([loadListsInProjectAction, project, currentProjectOntologies]) =>
          currentProjectOntologies.find(x => x.id === this._ontologyService.getOntologyIriFromRoute(project?.shortcode))
        )
      )
      .subscribe(readOnto => {
        if (readOnto) {
          // one ontology is selected:
          // get all information to display this ontology
          // with all classes, properties and connected lists
          this.resetOntologyView(readOnto);
        }
      });
  }

  initOntology() {
    let currentOntology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    if (!currentOntology) {
      const projectOntologies = this._store.selectSnapshot(OntologiesSelectors.projectOntologies);
      const projectIri = this._projectService.uuidToIri(this.projectUuid);
      const currentProject = this._store.selectSnapshot(ProjectsSelectors.currentProject);
      const ontologyIri = this._ontologyService.getOntologyIriFromRoute(currentProject.shortcode);
      currentOntology = projectOntologies[projectIri]?.readOntologies.find(o => o.id === ontologyIri);
      if (currentOntology) {
        this.resetOntologyView(currentOntology);
      } else {
        const isLoading = this._store.selectSnapshot(OntologiesSelectors.isLoading);
        if (isLoading === false) {
          this._store.dispatch(new LoadOntologyAction(ontologyIri, this.projectUuid, true));
          this._actions$
            .pipe(ofActionSuccessful(LoadOntologyAction))
            .pipe(take(1))
            .subscribe(() => {
              this.initOntology();
              this._cd.markForCheck();
            });
        }
      }
    } else {
      this.resetOntologyView(currentOntology);
    }
  }

  private initOntoClasses(allOntoClasses: ClassDefinition[]) {
    // reset the ontology classes
    this.ontoClasses = [];

    // display only the classes which are not a subClass of Standoff
    allOntoClasses.forEach(resClass => {
      if (resClass.subClassOf.length) {
        const splittedSubClass = resClass.subClassOf[0].split('#');
        if (!splittedSubClass[0].includes(Constants.StandoffOntology) && !splittedSubClass[1].includes('Standoff')) {
          this.ontoClasses.push(resClass);
        }
      }
    });
    // sort classes by label
    // --> TODO: add sort functionallity to the gui
    this.ontoClasses = this._sortingService.keySortByAlphabetical(this.ontoClasses, 'label');
  }

  initOntoProperties(ontology: ReadOntology, allOntoProperties: PropertyDefinition[]) {
    // reset the ontology properties
    const listOfProperties = [];

    // display only the properties which are not a subjectType of Standoff
    allOntoProperties.forEach(resProp => {
      const standoff = resProp.subjectType ? resProp.subjectType.includes('Standoff') : false;
      if (resProp.objectType !== Constants.LinkValue && !standoff) {
        listOfProperties.push(resProp);
      }
    });

    // sort properties by label
    this.ontoProperties = {
      ontology: ontology.id,
      properties: this._sortingService.keySortByAlphabetical(listOfProperties, 'label'),
    };
  }

  trackByClassDefinitionFn = (index: number, item: ClassDefinition) => `${index}-${item.id}`;

  trackByPropertyDefinitionFn = (index: number, item: PropertyDefinition) => `${index}-${item.id}`;

  trackByDefaultClassFn = (index: number, item: DefaultClass) => `${index}-${item.iri}`;

  trackByElementFn = (index: number) => `${index}`;

  onLastModificationDateChange(): void {
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    // TODO reload or just update lastModificationDate in the state?
    this._store.dispatch(new LoadOntologyAction(ontology.id, this.projectUuid, true));
  }

  /**
   * opens ontology route by iri
   * @param id ontology id/iri
   * @param view 'classes' | 'properties' | ' graph'
   */
  private openOntologyRoute(id: string, view: 'classes' | 'properties' | 'graph' = 'classes') {
    this.view = view;

    this._router.navigate(
      [RouteConstants.project, this.projectUuid, RouteConstants.ontologies, encodeURIComponent(id), view],
      { skipLocationChange: false }
    );
  }

  /**
   * resets the current view and the selected ontology
   * @param id
   */
  private resetOntology(id: string) {
    this._store.dispatch([new SetCurrentOntologyAction(null), new CurrentOntologyCanBeDeletedAction()]);
    this.ontoClasses = [];
    this.openOntologyRoute(id, this.view);
    this.initOntologiesList();
  }

  resetOntologyView(ontology: ReadOntology) {
    this.initView(ontology);
    this._dspApiConnection.v2.ontologyCache.reloadCachedItem(ontology.id);
    // grab the onto class information to display
    this.initOntoClasses(getAllEntityDefinitionsAsArray(ontology.classes));
    // grab the onto properties information to display
    this.initOntoProperties(ontology, getAllEntityDefinitionsAsArray(ontology.properties));

    this._store.dispatch([
      new SetCurrentOntologyAction(ontology),
      new SetCurrentProjectOntologyPropertiesAction(this.projectIri),
      new CurrentOntologyCanBeDeletedAction(),
    ]);
  }

  /**
   * opens ontology form to create or edit ontology info
   * @param mode
   * @param [iri] only in edit mode
   */
  openOntologyForm(mode: 'createOntology' | 'editOntology', iri?: string): void {
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    const title = iri ? ontology.label : 'Data model';

    const uuid = ProjectService.IriToUuid(this.projectUuid);
    const existingOntologyNames = this._store.selectSnapshot(OntologiesSelectors.currentProjectExistingOntologyNames);

    const dialogConfig: MatDialogConfig = {
      width: '640px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode,
        title,
        id: iri,
        project: uuid,
        existing: existingOntologyNames,
      },
    };

    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.initOntologiesList();
    });
  }

  createResourceClass(resClassInfo: DefaultClass): void {
    const currentOntology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);

    this._dialog
      .open<CreateResourceClassDialogComponent, CreateResourceClassDialogProps, null>(
        CreateResourceClassDialogComponent,
        {
          data: {
            id: resClassInfo.iri,
            title: resClassInfo.label,
            ontologyId: currentOntology.id,
            lastModificationDate: currentOntology.lastModificationDate,
          },
        }
      )
      .afterClosed()
      .subscribe(event => {
        if (event !== false) {
          this.initOntologiesList();
        }
      });
  }

  updateResourceClass(resClassInfo: DefaultClass, resClass: ResourceClassDefinitionWithAllLanguages): void {
    const currentOntology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);

    this._dialog
      .open<EditResourceClassDialogComponent, EditResourceClassDialogProps, boolean>(EditResourceClassDialogComponent, {
        data: {
          id: resClassInfo.iri,
          title: resClassInfo.label,
          ontologyId: currentOntology.id,
          lastModificationDate: currentOntology.lastModificationDate,
          name: resClass.label,
          comments: resClass.comments as MultiLanguages,
          labels: resClass.labels as MultiLanguages,
        },
      })
      .afterClosed()
      .subscribe(event => {
        if (event === true) {
          this.initOntologiesList();
        }
      });
  }

  editProperty(data: PropertyInfoObject) {
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    this._dialog
      .open<EditPropertyFormDialogComponent, EditPropertyFormDialogProps>(EditPropertyFormDialogComponent, {
        data: {
          ontology,
          lastModificationDate: ontology.lastModificationDate,
          propertyInfo: data,
        },
      })
      .afterClosed()
      .subscribe(() => {
        // get the ontologies for this project
        this.initOntologiesList();
        // update the view of resource class or list of properties
        this.initOntology();
      });
  }

  deleteOntology() {
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);

    this._dialogService
      .afterConfirmation('Do you want to delete this data model ?')
      .pipe(
        switchMap(() =>
          this._dspApiConnection.v2.onto.deleteOntology({
            id: ontology.id,
            lastModificationDate: ontology.lastModificationDate,
          })
        )
      )
      .subscribe(() => {
        this._store.dispatch(new ClearProjectOntologiesAction(this.projectUuid));
        this.initOntologiesList();
        this._router.navigateByUrl(`/project/${this.projectUuid}`, {
          skipLocationChange: false,
        });
      });
  }

  deleteResourceClass(resClassIri: string) {
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    this._dialogService
      .afterConfirmation('Do you want to delete this resource class?')
      .pipe(
        switchMap(() =>
          this._dspApiConnection.v2.onto.deleteResourceClass({
            id: resClassIri,
            lastModificationDate: ontology.lastModificationDate,
          })
        )
      )
      .subscribe(() => {
        this.ontoClasses = [];
        this.initOntologiesList();
      });
  }

  deleteProperty(iri: string) {
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    this._dialogService
      .afterConfirmation('Do you want to delete this property?')
      .pipe(
        switchMap(() =>
          this._dspApiConnection.v2.onto.deleteResourceProperty({
            id: iri,
            lastModificationDate: ontology.lastModificationDate,
          })
        )
      )
      .subscribe(() => {
        this._store.dispatch(new ClearCurrentOntologyAction());
        // get the ontologies for this project
        this.initOntologiesList();
        // update the view of resource class or list of properties
        this.initOntology();
      });
  }

  private setTitle() {
    combineLatest([ProjectBase.navigationEndFilter(this._router.events), this.project$, this.currentOntology$])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(([event, project, currentOntology]) => {
        this._titleService.setTitle(`Project ${project?.shortname} | Data model ${currentOntology.id ? '' : 's'}`);
      });
  }
}
