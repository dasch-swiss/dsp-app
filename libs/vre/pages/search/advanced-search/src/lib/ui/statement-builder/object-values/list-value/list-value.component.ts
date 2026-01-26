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
import { debounceTime, ReplaySubject, Subscription } from 'rxjs';
import { NodeValue } from '../../../../model';
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
        (optionSelected)="onSelectionChange($event.option.value)">
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
  @Input() selectedListNode?: NodeValue | undefined;

  @Output() emitValueChanged = new EventEmitter<string>();

  private _dataService = inject(DynamicFormsDataService);

  private valueChangesSubscription?: Subscription;

  valueFilterCtrl: FormControl<string | null> = new FormControl<string | null>(null, [Validators.required]);

  filteredList$: ReplaySubject<ListNodeV2[]> = new ReplaySubject<ListNodeV2[]>(1);

  private get sortedLabelList(): ListNodeV2[] {
    return this.rootListNode ? [...this.rootListNode.children].sort((a, b) => a.label.localeCompare(b.label)) : [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rootListNodeIri']) {
      this.valueChangesSubscription?.unsubscribe();

      this._dataService.getList$(this.rootListNodeIri).subscribe(rootListNode => {
        this.rootListNode = rootListNode;

        if (this.selectedListNode) {
          this.valueFilterCtrl.setValue(this.selectedListNode.label || '');
        }

        const list = [...(this.sortedLabelList || [])];
        this.filteredList$.next(list);
        this.valueChangesSubscription = this.valueFilterCtrl.valueChanges
          .pipe(debounceTime(300))
          .subscribe((value: string | null) => {
            let filtered = [];
            if (value) {
              filtered = this._filterItems(this.sortedLabelList || [], value.toLowerCase());
            } else {
              filtered = [...(this.sortedLabelList || [])];
            }
            this.filteredList$.next(filtered);
          });
      });
    }
  }

  trackByFn = (index: number, item: any) => `${index}-${item.label}`;

  displayNode(node: any | null): string {
    return node ? node.label : '';
  }

  onSelectionChange(node: ListNodeV2) {
    this.emitValueChanged.emit(node.id);
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
