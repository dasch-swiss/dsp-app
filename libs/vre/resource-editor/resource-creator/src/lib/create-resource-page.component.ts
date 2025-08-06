import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { OntologyService, ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-create-resource-page',
  template: `
    <app-centered-layout>
      <h2 data-cy="create-resource-title">Create new resource of type: {{ classLabel }}</h2>
      <app-create-resource-form
        *ngIf="resourceClassIri && projectShortcode"
        [resourceClassIri]="resourceClassIri"
        [projectIri]="projectIri"
        [projectShortcode]="projectShortcode"
        (createdResourceIri)="afterCreation($event)" />
    </app-centered-layout>
  `,
})
export class CreateResourcePageComponent implements OnDestroy {
  private _destroy = new Subject<void>();

  private _projectUuid = this._route.snapshot.params['uuid'] ?? this._route.parent!.snapshot.params['uuid'];

  project$ = this._store.select(ProjectsSelectors.currentProject);

  ontologyId = '';
  resourceClassIri = '';
  projectShortcode?: string;

  get classLabel() {
    return this.resourceClassIri ? this.resourceClassIri.split('#')[1] : '';
  }

  get projectIri() {
    return this._projectService.uuidToIri(this._projectUuid);
  }

  constructor(
    private _ontologyService: OntologyService,
    protected _projectService: ProjectService,
    private _resourceService: ResourceService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _store: Store
  ) {
    this.project$.pipe(takeUntil(this._destroy)).subscribe(project => {
      if (!project) {
        return;
      }

      this.projectShortcode = project.shortcode;
      this.ontologyId = this._ontologyService.getOntologyIriFromRoute(project.shortcode) || '';
      this.resourceClassIri = `${this.ontologyId}#${this._route.snapshot.params[RouteConstants.classParameter]}`;
    });
  }

  afterCreation(resourceIri: string) {
    const uuid = this._resourceService.getResourceUuid(resourceIri);
    this._router.navigate(['..', uuid], { relativeTo: this._route });
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
  }
}
