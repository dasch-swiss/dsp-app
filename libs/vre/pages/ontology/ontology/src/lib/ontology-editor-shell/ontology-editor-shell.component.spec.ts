import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { BehaviorSubject } from 'rxjs';
import type { ResourceClassInfo } from '../ontology.types';
import { OntologyEditService } from '../services/ontology-edit.service';
import { OntologyEditorViewService } from '../services/ontology-editor-view.service';
import { OntologyEditorShellComponent } from './ontology-editor-shell.component';

/**
 * Smoke tests for the three-pane shell.
 *
 * The shell is intentionally thin in this task — child components land in
 * Phase 2. The contract covered here:
 *   1. Renders three `<as-split-area>` placeholder regions.
 *   2. Provides `OntologyEditorViewService` at the component level (so the
 *      shell owns the lifetime of view state).
 *   3. The `<as-split>` `disabled` host class reflects `isPropertyDragging$`,
 *      confirming the spike-chosen mitigation is wired up.
 */
describe('OntologyEditorShellComponent', () => {
  let currentOntologyClasses$: BehaviorSubject<ResourceClassInfo[]>;
  let currentOntology$: BehaviorSubject<{ id: string } | null>;
  let hasProjectAdminRights$: BehaviorSubject<boolean>;
  let fixture: ComponentFixture<OntologyEditorShellComponent>;

  beforeEach(() => {
    currentOntologyClasses$ = new BehaviorSubject<ResourceClassInfo[]>([]);
    currentOntology$ = new BehaviorSubject<{ id: string } | null>(null);
    hasProjectAdminRights$ = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      imports: [OntologyEditorShellComponent],
      providers: [
        {
          provide: OntologyEditService,
          useValue: { currentOntologyClasses$, currentOntology$ },
        },
        {
          provide: ProjectPageService,
          useValue: { hasProjectAdminRights$ },
        },
      ],
    });

    fixture = TestBed.createComponent(OntologyEditorShellComponent);
    fixture.detectChanges();
  });

  it('renders three pane placeholders', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[data-testid="navigator-pane"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="workspace-pane"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="library-pane"]')).not.toBeNull();

    const areas = host.querySelectorAll('as-split-area');
    expect(areas.length).toBe(3);
  });

  it('provides OntologyEditorViewService at the component level (page-scoped state)', () => {
    // Resolve from the component's own injector — proves it isn't bubbling up.
    const fromComponent = fixture.componentRef.injector.get(OntologyEditorViewService);
    expect(fromComponent).toBe(fixture.componentInstance.viewService);
    expect(fromComponent).toBeInstanceOf(OntologyEditorViewService);
  });

  it('toggles the .as-disabled host class on the splitter as isPropertyDragging$ flips', () => {
    const host: HTMLElement = fixture.nativeElement;
    const split = host.querySelector('as-split');
    expect(split).not.toBeNull();
    expect(split!.classList.contains('as-disabled')).toBe(false);

    fixture.componentInstance.viewService.setPropertyDragging(true);
    fixture.detectChanges();
    expect(split!.classList.contains('as-disabled')).toBe(true);

    fixture.componentInstance.viewService.setPropertyDragging(false);
    fixture.detectChanges();
    expect(split!.classList.contains('as-disabled')).toBe(false);
  });
});
