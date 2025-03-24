import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Constants, ListNodeV2 } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertyFormItem } from '../../../data-access/advanced-search-store/advanced-search-store.service';

@Component({
  selector: 'app-property-form-list-value',
  standalone: true,
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
    <mat-form-field appearance="fill" class="dropdown">
      <mat-label>{{ 'form.project.advancedSearch.propertyListValue' | translate }}</mat-label>
      <input
        matInput
        [formControl]="valueFilterCtrl"
        type="text"
        aria-label="property-form-list-value"
        [matAutocomplete]="auto" />
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayNode"
        (optionSelected)="onSelectionChange($event.option.value)">
        <ng-container *ngFor="let node of filteredList$ | async; trackBy: trackByFn">
          <ng-container *ngTemplateOutlet="renderNode; context: { node: node, depth: 0 }"></ng-container>
        </ng-container>

        <ng-template #renderNode let-node="node" let-depth="depth">
          <mat-option [value]="node">
            <span [style.padding-left.px]="depth * 15">{{ node.label }}</span>
          </mat-option>
          <ng-container *ngIf="node.children?.length > 0">
            <ng-container *ngFor="let subchild of node.children; trackBy: trackByFn">
              <ng-container
                *ngTemplateOutlet="renderNode; context: { node: subchild, depth: depth + 1 }"></ng-container>
            </ng-container>
          </ng-container>
        </ng-template>
      </mat-autocomplete>
    </mat-form-field>
  `,
  styleUrls: ['./property-form-list-value.component.scss'],
})
export class PropertyFormListValueComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() list: ListNodeV2 | undefined = undefined;
  @Input() value: string | PropertyFormItem[] | undefined = undefined;

  @Output() emitValueChanged = new EventEmitter<string>();

  destroyed: Subject<void> = new Subject<void>();

  valueFilterCtrl: FormControl<string | null> = new FormControl<string | null>(null);

  constants = Constants;

  selectedItem: ListNodeV2 | undefined = undefined;

  filteredList$: ReplaySubject<ListNodeV2[]> = new ReplaySubject<ListNodeV2[]>(1);

  get sortedLabelList(): ListNodeV2[] | undefined {
    return this.list?.children.sort((a, b) => a.label.localeCompare(b.label));
  }

  ngOnInit(): void {
    this.initAutocompleteControl();
  }

  ngAfterViewInit(): void {
    if (this.list && this.value && typeof this.value === 'string') {
      this.selectedItem = this.findItemById(this.list, this.value);
    }
  }

  trackByFn = (index: number, item: any) => `${index}-${item.label}`;

  displayNode(node: any | null): string {
    return node ? node.label : '';
  }

  onSelectionChange(node: ListNodeV2) {
    this.selectedItem = node;
    this.emitValueChanged.emit(node.id);
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private findItemById(node: ListNodeV2, targetId: string): ListNodeV2 | undefined {
    if (node.id === targetId) {
      return node;
    }
    for (const child of node.children) {
      const found = this.findItemById(child, targetId);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  private initAutocompleteControl() {
    const list = [...(this.sortedLabelList || [])];
    this.filteredList$.next(list);
    this.valueFilterCtrl.valueChanges.pipe(takeUntil(this.destroyed)).subscribe((value: any) => {
      let filtered = [];
      if (value) {
        const label = typeof value === 'object' ? value.label : value.toLowerCase();
        filtered = this.filterItems(this.sortedLabelList || [], label);
      } else {
        filtered = [...(this.sortedLabelList || [])];
      }

      this.filteredList$.next(filtered);
    });
  }

  private filterItems(nodes: ListNodeV2[], searchText: string): ListNodeV2[] {
    return nodes
      .map(node => {
        const matchedChildren = this.filterItems(node.children || [], searchText);
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
}
