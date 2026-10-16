import { ActivatedRoute } from '@angular/router';
import { APIV3ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { EMPTY, of } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { ProjectSidenavOntologiesComponent } from './project-sidenav-ontologies.component';

const ONTO_A = 'http://0.0.0.0:3333/ontology/0001/a/v2';
const ONTO_B = 'http://0.0.0.0:3333/ontology/0001/b/v2';

describe('ProjectSidenavOntologiesComponent', () => {
  let component: ProjectSidenavOntologiesComponent;

  beforeEach(() => {
    component = new ProjectSidenavOntologiesComponent(
      { currentProject$: EMPTY } as unknown as ProjectPageService,
      { firstChild: null } as unknown as ActivatedRoute,
      {} as OntologyService,
      {} as APIV3ApiService,
      { currentLanguage$: of('en') } as unknown as LocalizationService
    );
  });

  describe('which data-model groups are open', () => {
    it('falls back to the given default when nothing else decides', () => {
      expect(component.isExpanded(ONTO_A, true)).toBe(true);
      expect(component.isExpanded(ONTO_B, false)).toBe(false);
    });

    it('opens the data model of the class in the URL, and only that one', () => {
      component.initialExpandIri = ONTO_B;

      expect(component.isExpanded(ONTO_A, true)).toBe(false);
      expect(component.isExpanded(ONTO_B, false)).toBe(true);
    });

    it('lets the user close and reopen a group, whatever opened it', () => {
      component.initialExpandIri = ONTO_A;

      component.toggle(ONTO_A, component.isExpanded(ONTO_A, false));
      expect(component.isExpanded(ONTO_A, false)).toBe(false);

      component.toggle(ONTO_A, component.isExpanded(ONTO_A, false));
      expect(component.isExpanded(ONTO_A, false)).toBe(true);
    });

    it('keeps several groups open at once', () => {
      component.toggle(ONTO_A, false);
      component.toggle(ONTO_B, false);

      expect(component.isExpanded(ONTO_A, false)).toBe(true);
      expect(component.isExpanded(ONTO_B, false)).toBe(true);
    });
  });
});
