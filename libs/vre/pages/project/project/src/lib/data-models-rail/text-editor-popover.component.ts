import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';
import { DescriptionEditorComponent, TextKind } from './description-editor.component';
import { LanguageTextEdit } from './language-texts.component';

/** A name or description being edited: whose, which, the language it opened on and the line it opened under. */
export interface TextEditTarget extends LanguageTextEdit {
  /** The IRI of the class or property. */
  id: string;
  /** Its name, for the editor's title and the message once saved. */
  label: string;
  kind: TextKind;
  /** The text in each language it has. */
  texts: LanguageText[];
}

/** Saves the text, every language at once; emits once saved, errors when not. */
export type SaveTexts = (target: TextEditTarget, texts: LanguageText[]) => Observable<unknown>;

/**
 * The editing of names and descriptions in a table, one at a time: what is open and whether it is saving. Create it
 * in an injection context.
 */
export class TextEditing {
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly target = signal<TextEditTarget | null>(null);
  readonly saving = signal(false);

  constructor(private readonly _save: SaveTexts) {}

  /** The language being edited in this text, if any; its line shows it. */
  activeLanguage(id: string, kind: TextKind): string | null {
    const target = this.target();
    return target?.id === id && target.kind === kind ? target.language : null;
  }

  open(target: TextEditTarget): void {
    this.target.set(target);
  }

  close(): void {
    if (!this.saving()) this.target.set(null);
  }

  save(texts: LanguageText[]): void {
    const target = this.target();
    if (!target) return;
    const t = 'pages.dataModels2.descriptionEditor';
    this.saving.set(true);
    this._save(target, texts)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.target.set(null);
          this._notification.openSnackBar(this._translate.instant(`${t}.saved`, { class: target.label }));
        },
        error: () => {
          // The editor stays open with the text, to try again.
          this.saving.set(false);
          this._notification.openSnackBar(this._translate.instant(`${t}.notSaved`), 'error');
        },
      });
  }
}

/**
 * The editor of the name or description `editing` has open, as a side panel on the right of the table, over a class
 * or property panel; closed, it takes no room.
 */
@Component({
  selector: 'app-text-editor-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.open]': '!!editing().target()' },
  imports: [DescriptionEditorComponent],
  template: `
    @if (editing().target(); as target) {
      <app-description-editor
        [texts]="target.texts"
        [kind]="target.kind"
        [language]="target.language"
        [classLabel]="target.label"
        [saving]="editing().saving()"
        (saved)="editing().save($event)"
        (cancelled)="editing().close()" />
    }
  `,
  styles: [
    `
      :host(.open) {
        position: absolute;
        z-index: 102;
        top: 0;
        right: 0;
        bottom: 0;
        width: 440px;
        max-width: 50%;
      }

      app-description-editor {
        height: 100%;
      }
    `,
  ],
})
export class TextEditorPopoverComponent {
  readonly editing = input.required<TextEditing>();
}
