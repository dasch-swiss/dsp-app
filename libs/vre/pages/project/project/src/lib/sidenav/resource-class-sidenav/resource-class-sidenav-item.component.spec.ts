import { ActivatedRoute, Router } from '@angular/router';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NEVER } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { ResourceClassSidenavItemComponent } from './resource-class-sidenav-item.component';

const CLASS_IRI = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';

describe('ResourceClassSidenavItemComponent', () => {
  let component: ResourceClassSidenavItemComponent;
  let navigate: jest.Mock;
  let queryParams: Record<string, string>;

  const queryParamsOf = (call: number) => navigate.mock.calls[call][1].queryParams;

  beforeEach(() => {
    navigate = jest.fn();
    queryParams = {};

    const router = {
      navigate,
      events: NEVER,
      routerState: {
        snapshot: { root: { queryParamMap: { get: (key: string) => queryParams[key] ?? null } } },
      },
    } as unknown as Router;

    const route = { firstChild: null } as unknown as ActivatedRoute;

    component = new ResourceClassSidenavItemComponent({} as OntologyService, {} as ProjectPageService, router, route);
    component.iri = CLASS_IRI;
  });

  it('NavigatesToTheClassUnderItsOwnOntology', () => {
    component.selectResourceClass();

    expect(navigate.mock.calls[0][0]).toEqual(['anything', 'Thing']);
  });

  it('CarriesTheTableViewAcrossAClassSwitch', () => {
    queryParams['view'] = 'table';

    component.selectResourceClass();

    expect(queryParamsOf(0)).toEqual({ view: 'table' });
  });

  it('DropsTheQueryStateThatBelongedToThePreviousClass', () => {
    queryParams['view'] = 'table';
    queryParams['q'] = 'braut';
    queryParams['orderBy'] = 'http://example.org/prop';

    component.selectResourceClass();

    expect(queryParamsOf(0)).toEqual({ view: 'table' });
  });

  it('WritesNoViewWhenTheUserIsInListView', () => {
    component.selectResourceClass();

    expect(queryParamsOf(0)).toEqual({ view: null });
  });
});
