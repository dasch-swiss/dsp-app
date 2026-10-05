import { ActivatedRoute, Router } from '@angular/router';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NEVER } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { ResourceClassSidenavItemComponent } from './resource-class-sidenav-item.component';

const CLASS_IRI = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';

/**
 * Only the navigation is exercised. The rest of the component is a label, a count and an icon
 * bound straight from inputs, and `isSelected$` is the route's business — it is stubbed to a
 * stream that never emits so constructing the component does not require a router state.
 */
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

    component = new ResourceClassSidenavItemComponent(
      {} as OntologyService,
      {} as ProjectPageService,
      router,
      route
    );
    component.iri = CLASS_IRI;
  });

  it('NavigatesToTheClassUnderItsOwnOntology', () => {
    component.selectResourceClass();

    expect(navigate.mock.calls[0][0]).toEqual(['anything', 'Thing']);
  });

  /**
   * Which view you are reading in is a property of the user, not of the class — switching class
   * in table view and landing back in the list is the app forgetting what you were doing.
   */
  it('CarriesTheTableViewAcrossAClassSwitch', () => {
    queryParams['view'] = 'table';

    component.selectResourceClass();

    expect(queryParamsOf(0)).toEqual({ view: 'table' });
  });

  /**
   * Naming the params replaces them wholesale, so the filters, term and sort — which address the
   * class being left — are dropped rather than carried onto a class they do not describe. The
   * class view resets them on switch anyway; doing it in one navigation avoids the extra history
   * entry and the flash of a stale filter bar.
   */
  it('DropsTheQueryStateThatBelongedToThePreviousClass', () => {
    queryParams['view'] = 'table';
    queryParams['q'] = 'braut';
    queryParams['orderBy'] = 'http://example.org/prop';

    component.selectResourceClass();

    expect(queryParamsOf(0)).toEqual({ view: 'table' });
  });

  /** List is the default and stays out of the URL, so a null clears any stale `view`. */
  it('WritesNoViewWhenTheUserIsInListView', () => {
    component.selectResourceClass();

    expect(queryParamsOf(0)).toEqual({ view: null });
  });
});
