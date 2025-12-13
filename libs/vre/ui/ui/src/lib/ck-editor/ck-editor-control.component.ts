import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CkEditorComponent } from './ck-editor.component';

@Component({
  selector: 'app-ck-editor-control',
  template: ` <div class="mat-body-2 title">{{ label }}</div>
    <app-ck-editor [control]="control" [projectShortcode]="projectShortcode" class="value" />`,
  styles: [
    `
      .title {
        background: #fafafa;
        padding: 8px;
        margin: 0 1px;
        position: relative;
        top: 1px;
        z-index: 1;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
      }

      .value {
        display: block;
        margin-bottom: 32px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CkEditorComponent],
})
export class CkEditorControlComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) control!: FormControl<string>;
  @Input() projectShortcode?: string | null;
}
