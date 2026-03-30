import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { QueryExecutionService } from '../service/query-execution.service';
import { SearchStateService } from '../service/search-state.service';
import { OrderByComponent } from './order-by/order-by.component';

@Component({
  selector: 'app-advanced-search-footer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, OrderByComponent, LoadingButtonDirective],
  template: `
    <app-order-by />
    <div class="flex flex-end gap-05em">
      <button mat-button mat-stroked-button color="primary" (click)="resetTriggered.emit()">Reset</button>
      <button mat-button mat-stroked-button color="primary" (click)="restorePreviousSearch.emit()">
        Use previous search
      </button>
      <button
        mat-button
        mat-raised-button
        color="primary"
        class="min-width-8em-justify-center"
        appLoadingButton
        [isLoading]="queryExecutionService.queryIsExecuting()"
        [disabled]="(searchState.isFormStateValidAndComplete$ | async) === false"
        (click)="searchTriggered.emit()">
        Search
      </button>
    </div>
  `,
  styleUrl: '../advanced-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchFooterComponent {
  @Output() searchTriggered = new EventEmitter<void>();
  @Output() resetTriggered = new EventEmitter<void>();
  @Output() restorePreviousSearch = new EventEmitter<void>();

  searchState = inject(SearchStateService);
  queryExecutionService = inject(QueryExecutionService);
}
