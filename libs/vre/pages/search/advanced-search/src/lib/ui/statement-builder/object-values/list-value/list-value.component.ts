import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ListNodeV2 } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, ReplaySubject, Subscription, take } from 'rxjs';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';

@Component({
  standalone: true,
  selector: 'app-list-value',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    TranslateModule,
  ],
  template: `
    <mat-form-field class="width-100-percent" appearance="fill">
      <mat-label>{{ 'pages.search.propertyFormListValue' | translate }}</mat-label>
      <input
        matInput
        [formControl]="valueFilterCtrl"
        type="text"
        aria-label="property-form-list-value"
        [matAutocomplete]="auto"
        required />
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayNode"
        (optionSelected)="onSelectionChange($event.option.value)"
        (opened)="onAutocompleteOpened()"
        (closed)="onAutocompleteClosed()">
        @for (node of filteredList$ | async; track trackByFn($index, node)) {
          <ng-container *ngTemplateOutlet="renderNode; context: { node: node, depth: 0 }" />
        }
        <ng-template #renderNode let-node="node" let-depth="depth">
          <mat-option [value]="node">
            <span [style.padding-left.px]="depth * 15">{{ node.label }}</span>
          </mat-option>
          @if (node.children?.length > 0) {
            @for (subchild of node.children; track trackByFn($index, subchild)) {
              <ng-container *ngTemplateOutlet="renderNode; context: { node: subchild, depth: depth + 1 }" />
            }
          }
        </ng-template>
      </mat-autocomplete>
    </mat-form-field>
  `,
  styleUrl: '../../../../advanced-search.component.scss',
})
export class ListValueComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) rootListNodeIri!: string;
  rootListNode?: ListNodeV2;
  @Input() selectedListItem?: IriLabelPair;

  @Output() emitValueChanged = new EventEmitter<IriLabelPair>();

  private _dataService = inject(DynamicFormsDataService);

  private valueChangesSubscription?: Subscription;

  valueFilterCtrl: FormControl<ListNodeV2 | string | null> = new FormControl<ListNodeV2 | string | null>(null, [
    Validators.required,
  ]);

  filteredList$: ReplaySubject<ListNodeV2[]> = new ReplaySubject<ListNodeV2[]>(1);

  selectedListNode?: ListNodeV2;

  private get sortedLabelList(): ListNodeV2[] {
    return this.rootListNode ? [...this.rootListNode.children].sort((a, b) => a.label.localeCompare(b.label)) : [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rootListNodeIri']) {
      this.valueChangesSubscription?.unsubscribe();

      this._dataService
        .getList$(this.rootListNodeIri)
        .pipe(take(1))
        .subscribe(rootListNode => {
          this.rootListNode = rootListNode;
          const list = [...(this.sortedLabelList || [])];
          this.filteredList$.next(list);
          this._tryRestoreSelectedItem();
        });
      this.valueChangesSubscription = this.valueFilterCtrl.valueChanges
        .pipe(debounceTime(300))
        .subscribe((value: string | ListNodeV2 | null) => {
          const label = typeof value === 'string' ? value : value?.label || '';
          let filtered = [];
          if (value) {
            filtered = this._filterItems(this.sortedLabelList || [], label.toLowerCase());
          } else {
            filtered = [...(this.sortedLabelList || [])];
          }
          this.filteredList$.next(filtered);
        });
    }

    if (changes['selectedListItem'] && this.selectedListItem && this.rootListNode) {
      this._tryRestoreSelectedItem();
    }
  }

  private _tryRestoreSelectedItem(): void {
    if (!this.selectedListItem || !this.sortedLabelList) return;

    const selectedItem = this._findNodeById(this.sortedLabelList, this.selectedListItem.iri);
    if (selectedItem) {
      this.selectedListNode = selectedItem;
      this.valueFilterCtrl.patchValue(selectedItem);
    }
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

  trackByFn = (index: number, item: any) => `${index}-${item.label}`;

  displayNode(node: any | null): string {
    return node ? node.label : '';
  }

  onAutocompleteOpened() {
    // user should get all items when opening the autocomplete for selection
    this.valueFilterCtrl.patchValue(null);
  }

  onAutocompleteClosed() {
    // reset the input as there are no changes
    if (this.selectedListNode) {
      this.valueFilterCtrl.patchValue(this.selectedListNode);
    } else {
      this.valueFilterCtrl.patchValue(null);
    }
  }

  onSelectionChange(node: ListNodeV2) {
    this.selectedListNode = node;
    this.valueFilterCtrl.patchValue(node);
    const nodeValue: IriLabelPair = { iri: node.id, label: node.label };
    this.emitValueChanged.emit(nodeValue);
  }

  private _filterItems(nodes: ListNodeV2[], searchText: string): ListNodeV2[] {
    return nodes
      .map(node => {
        const matchedChildren = this._filterItems(node.children || [], searchText);
        const isMatch = node.label.toLowerCase().includes(searchText);

        if (isMatch || matchedChildren.length > 0) {
          return {
            ...node,
            children: matchedChildren,
          };
        }
        return null;
      })
      .filter(node => node !== null) as ListNodeV2[];
  }

  ngOnDestroy() {
    this.valueChangesSubscription?.unsubscribe();
  }
}
