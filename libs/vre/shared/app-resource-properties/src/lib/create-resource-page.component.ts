import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ResourceClassIriService } from './resource-class-iri.service';

@Component({
  selector: 'app-create-resource-page',
  template: ` <h3>Create new resource of type: {{ (resClass$ | async)?.label }}</h3>
    <app-create-resource-form
      *ngIf="resourceClassIriService.resourceClassIriFromParamSubject.asObservable() | async as classIri"
      [resourceType]="(resClass$ | async)?.label"
      [resourceClassIri]="classIri"
      [projectIri]="projectIri"
      (createdResourceIri)="afterCreation($event)"></app-create-resource-form>`,
  providers: [ResourceClassIriService],
})
export class CreateResourcePageComponent {
  projectOntologies$ = this._store.select(OntologiesSelectors.projectOntologies);
  projectUuid = this._route.snapshot.params['uuid'] ?? this._route.parent!.snapshot.params['uuid'];

  constructor(
    private _route: ActivatedRoute,
    private _store: Store,
    protected _projectService: ProjectService,
    private _router: Router,
    private _resourceService: ResourceService,
    public resourceClassIriService: ResourceClassIriService
  ) {}

  get projectIri() {
    return this._projectService.uuidToIri(this.projectUuid);
  }

  resClass$ = combineLatest([
    this.projectOntologies$.pipe(filter(v => Object.keys(v).length !== 0)),
    this.resourceClassIriService.resourceClassIriFromParamSubject.asObservable(),
    this.resourceClassIriService.ontoId$,
  ]).pipe(
    map(([projectOntologies, classId, ontoId]) => {
      const ontology = projectOntologies[this.projectIri].readOntologies.find(onto => onto.id === ontoId);
      if (!ontology) return undefined;
      // find ontology of current resource class to get the class label
      const classes = getAllEntityDefinitionsAsArray(ontology.classes);
      return <ResourceClassDefinition>classes[classes.findIndex(res => res.id === classId)];
    })
  );

  afterCreation(resourceIri: string) {
    const uuid = this._resourceService.getResourceUuid(resourceIri);
    this._router.navigate(['..', uuid], { relativeTo: this._route });
  }
}
