import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { OntologyMapPageComponent } from './ontology-map-page.component';

const BEOL = 'http://0.0.0.0:3333/ontology/0801/beol/v2';
const BIBLIO = 'http://0.0.0.0:3333/ontology/0801/biblio/v2';
const graph = (iri: string): DataModelGraph => ({
  nodes: [{ id: `${iri}#Letter`, label: 'Letter', kind: 'class', count: 1, navigable: true }],
  edges: [],
});

describe('OntologyMapPageComponent', () => {
  let fixture: ComponentFixture<OntologyMapPageComponent>;
  let component: OntologyMapPageComponent;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigate: jest.Mock;

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({}));
    navigate = jest.fn();
    TestBed.configureTestingModule({
      imports: [OntologyMapPageComponent],
      providers: [
        provideTranslateService(),
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { queryParamMap: params } },
        { provide: LocalizationService, useValue: { currentLanguage$: of('en') } },
        { provide: ProjectPageService, useValue: { hasProjectAdminRights$: of(false) } },
        {
          provide: DataModelGraphService,
          useValue: {
            projectOntologies$: of([
              { ontology: { iri: BIBLIO, label: 'The Biblio ontology' } },
              { ontology: { iri: BEOL, label: 'The BEOL ontology' } },
            ]),
            graphs$: of(
              new Map([
                [BEOL, graph(BEOL)],
                [BIBLIO, graph(BIBLIO)],
              ])
            ),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(OntologyMapPageComponent);
    component = fixture.componentInstance;
  });

  it('shows the first data model by name when the URL names none', () => {
    expect(component.selected()?.iri).toBe(BEOL);
    expect(component.graph()).toEqual(graph(BEOL));
  });

  it('shows the data model the URL names, with the class to outline', () => {
    params.next(convertToParamMap({ ontology: 'biblio', class: `${BIBLIO}#Letter` }));

    expect(component.selected()?.iri).toBe(BIBLIO);
    expect(component.classIri()).toBe(`${BIBLIO}#Letter`);
  });

  it('reads the open panel and the graph filter from the URL', () => {
    params.next(convertToParamMap({ ontology: 'beol', panel: 'Letter', filter: 'Letter' }));

    expect(component.panelIri()).toBe(`${BEOL}#Letter`);
    expect(component.filterIris()).toEqual([`${BEOL}#Letter`]);
    expect(component.classIri()).toBe(`${BEOL}#Letter`);
  });

  it('ignores a class the shown data model does not have', () => {
    params.next(convertToParamMap({ ontology: 'beol', panel: 'Nothing' }));

    expect(component.panelIri()).toBeUndefined();
  });

  it('opens a panel and filters by navigating, so the browser history keeps each step', () => {
    component.openPanel(`${BEOL}#Letter`);
    component.setFilter([]);

    expect(navigate).toHaveBeenNthCalledWith(1, [], {
      relativeTo: expect.anything(),
      queryParamsHandling: 'merge',
      queryParams: { ontology: 'beol', panel: 'Letter' },
    });
    expect(navigate).toHaveBeenNthCalledWith(2, [], {
      relativeTo: expect.anything(),
      queryParamsHandling: 'merge',
      queryParams: { ontology: 'beol', filter: null },
    });
  });

  it('adds a class to the filter, or takes it out', () => {
    params.next(convertToParamMap({ ontology: 'beol', filter: 'Letter' }));

    component.toggleFilter(`${BEOL}#Letter`);

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ontology: 'beol', filter: null } })
    );
  });

  it('opens a clicked class in the Data tab', () => {
    component.open(`${BEOL}#Letter`);

    expect(navigate).toHaveBeenCalledWith(['..', 'data', 'beol', 'Letter'], expect.anything());
  });
});
