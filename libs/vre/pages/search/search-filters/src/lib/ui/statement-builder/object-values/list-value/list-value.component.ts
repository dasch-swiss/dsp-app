import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ListNodeV2WithAllLanguages } from '@dasch-swiss/dsp-js';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NestedMenuComponent } from '@dasch-swiss/vre/ui/nested-menu';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';

@Component({
  standalone: true,
  selector: 'app-list-value',
  imports: [NestedMenuComponent],
  template: `
    @if (rootListNode) {
      <app-nested-menu
        [data]="rootListNode"
        [selection]="selectedListNode?.labels ?? []"
        (selectedNode)="onSelectionChange($event)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListValueComponent implements OnInit, OnChanges {
  @Input({ required: true }) rootListNodeIri!: string;
  rootListNode?: ListNodeV2WithAllLanguages;
  @Input() selectedListItem?: IriLabelPair;

  @Output() emitValueChanged = new EventEmitter<IriLabelPair>();

  private _dataService = inject(DynamicFormsDataService);
  private _cdr = inject(ChangeDetectorRef);
  private _localizationService = inject(LocalizationService);
  private _destroyRef = inject(DestroyRef);

  private _rootIri$ = new BehaviorSubject<string | undefined>(undefined);

  selectedListNode?: ListNodeV2WithAllLanguages;

  ngOnInit(): void {
    // Single lifetime-scoped subscription. switchMap cancels any in-flight
    // fetch when rootListNodeIri changes, and combineLatest with
    // currentLanguage$ keeps the nested menu rendering in the active language.
    this._rootIri$
      .pipe(
        filter((iri): iri is string => iri !== undefined),
        switchMap(iri =>
          combineLatest([this._dataService.getListWithAllLanguages$(iri), this._localizationService.currentLanguage$])
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(([rootListNode]) => {
        this.rootListNode = rootListNode;
        this._tryRestoreSelectedItem();
        this._cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rootListNodeIri']) {
      this._rootIri$.next(this.rootListNodeIri);
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

  private _findNodeById(nodes: ListNodeV2WithAllLanguages[], id: string): ListNodeV2WithAllLanguages | undefined {
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

  onSelectionChange(node: ListNodeV2WithAllLanguages) {
    this.selectedListNode = node;
    const nodeValue: IriLabelPair = {
      iri: node.id,
      labels: node.labels,
      comments: node.comments,
    };
    this.emitValueChanged.emit(nodeValue);
  }
}
