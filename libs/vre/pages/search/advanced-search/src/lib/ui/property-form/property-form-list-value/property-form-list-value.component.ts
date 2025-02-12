import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Constants, ListNodeV2 } from '@dasch-swiss/dsp-js';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { PropertyFormItem } from '../../../data-access/advanced-search-store/advanced-search-store.service';

@Component({
  selector: 'app-property-form-list-value',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    NgxMatSelectSearchModule,
    ReactiveFormsModule,
  ],
  template: ` <mat-form-field appearance="fill" class="dropdown">
    <mat-select
      [(value)]="selectedItem"
      (selectionChange)="onSelectionChange($event)"
      panelClass="custom-select-panel"
      #singleSelect>
      <mat-option>
        <ngx-mat-select-search [formControl]="valueFilterCtrl"></ngx-mat-select-search>
      </mat-option>
      <mat-option *ngFor="let child of filteredList$ | async; trackBy: trackByFn" [value]="child">
        {{ child.label }}
      </mat-option>
    </mat-select>
  </mat-form-field>`,
  styleUrls: ['./property-form-list-value.component.scss'],
})
export class PropertyFormListValueComponent implements AfterViewInit, OnDestroy {
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

  ngAfterViewInit(): void {
    if (this.list && this.value && typeof this.value === 'string') {
      this.selectedItem = this.findItemById(this.list, this.value);
    }

    this.initAutocompleteControl();
  }

  trackByFn = (index: number, item: ListNodeV2) => `${index}-${item.id}`;

  onSelectionChange(event: any) {
    const selectedNode: ListNodeV2 = event.value;
    this.selectedItem = selectedNode;
    this.emitValueChanged.emit(selectedNode.id);
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
    this.filteredList$.next([...(this.sortedLabelList || [])]);
    this.valueFilterCtrl.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        takeWhile(item => !!item)
      )
      .subscribe(value =>
        this.filteredList$.next(
          (this.sortedLabelList || []).filter(item => item.label.toLowerCase().includes(value!.toLowerCase()))
        )
      );
  }
}
