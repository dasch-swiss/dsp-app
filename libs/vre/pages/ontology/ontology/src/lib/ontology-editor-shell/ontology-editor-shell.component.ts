import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { OntologyEditorViewService } from '../services/ontology-editor-view.service';

/**
 * Three-pane shell for the redesigned ontology editor.
 *
 * Owns `OntologyEditorViewService` via component-scoped providers so that
 * selection, filter, drag, and keyboard-assign state lives for the lifetime
 * of the shell and is torn down on navigation away.
 *
 * The `<as-split [disabled]>` binding follows the Phase 1 spike outcome:
 * while a property card is being dragged, the splitter gutters are disabled
 * so the CDK drag overlay isn't intercepted by `<as-split>`'s gutter logic.
 *
 * The three `<as-split-area>` children are currently placeholders — the
 * navigator / workspace / library components land in Phase 2 (Tasks #6+).
 */
@Component({
  selector: 'app-ontology-editor-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularSplitModule, AsyncPipe],
  providers: [OntologyEditorViewService],
  templateUrl: './ontology-editor-shell.component.html',
})
export class OntologyEditorShellComponent {
  readonly viewService = inject(OntologyEditorViewService);
}
