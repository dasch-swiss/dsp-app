import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ListNodeV2 } from '@dasch-swiss/dsp-js';
import { NestedMenuComponent } from '@dasch-swiss/vre/ui/nested-menu';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';

@Component({
  standalone: true,
  selector: 'app-list-value',
  imports: [CommonModule, NestedMenuComponent, TranslateModule],
  template: `
    @if (rootListNode) {
      <app-nested-menu
        [data]="rootListNode"
        [selection]="selectedListNode?.label || ''"
        (selectedNode)="onSelectionChange($event)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListValueComponent implements OnChanges {
  @Input({ required: true }) rootListNodeIri!: string;
  rootListNode?: ListNodeV2;
  @Input() selectedListItem?: IriLabelPair;

  @Output() emitValueChanged = new EventEmitter<IriLabelPair>();

  private _dataService = inject(DynamicFormsDataService);
  private _cdr = inject(ChangeDetectorRef);

  selectedListNode?: ListNodeV2;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rootListNodeIri']) {
      this._dataService
        .getList$(this.rootListNodeIri)
        .pipe(take(1))
        .subscribe(rootListNode => {
          this.rootListNode = rootListNode;
          this._tryRestoreSelectedItem();
          this._cdr.markForCheck();
        });
    }

    if (changes['selectedListItem'] && this.selectedListItem && this.rootListNode) {
      this._tryRestoreSelectedItem();
    }
  }

  private _tryRestoreSelectedItem(): void {
    if (!this.selectedListItem || !this.rootListNode) return;

    const selectedItem = this._findNodeById(this.rootListNode.children, this.selectedListItem.iri);
    if (selectedItem) {
      this.selectedListNode = selectedItem;
    }
    this._cdr.markForCheck();
  }

  private _findNodeById(nodes: ListNodeV2[], id: string): ListNodeV2 | undefined {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children?.length > 0) {
        const found = this._findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  onSelectionChange(node: ListNodeV2) {
    this.selectedListNode = node;
    const nodeValue: IriLabelPair = {
      iri: node.id,
      labels: node.label ? [{ language: '', value: node.label }] : [],
      comments: [],
    };
    this.emitValueChanged.emit(nodeValue);
  }
}
