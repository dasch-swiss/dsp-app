import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dasch-swiss-app-pager',
  imports: [NgIf, MatIconModule, MatButtonModule, TranslateModule],
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss'],
})
export class PagerComponent {
  @Output() pageChanged: EventEmitter<number> = new EventEmitter<number>();
  @Input() showNumberOfAllResults = true;
  @Input() nextPageIsAvailable: null | boolean = null;
  @Input() set numberOfAllResults(value: number) {
    this._numberOfAllResults = value;
    this._calculateRange(this.currentIndex);
  }
  get numberOfAllResults(): number {
    return this._numberOfAllResults;
  }

  static readonly pageSize = 25;

  private _numberOfAllResults: number = 0;

  PagerComponent = PagerComponent;

  currentIndex = 0;
  currentRangeStart = 1;
  currentRangeEnd = 0;

  previousDisabled = false;
  nextDisabled = false;

  constructor(private _cd: ChangeDetectorRef) {}

  initPager(): void {
    this.currentIndex = 0;
    this.currentRangeStart = 1;
    this.currentRangeEnd = 0;
    this.nextDisabled = false;
  }

  goToPage(direction: 'previous' | 'next') {
    if (direction === 'previous' && this.currentIndex > 0) {
      this.nextDisabled = false;
      this.currentIndex -= 1;
    }

    if (direction === 'next') {
      this.currentIndex += 1;

      const isEndRange = PagerComponent.pageSize * (this.currentIndex + 1) >= this.numberOfAllResults;
      // if end range for the next page of results is greater than the total number of results
      if ((isEndRange && !this.nextPageIsAvailable) || (isEndRange && this.nextPageIsAvailable === true)) {
        this.nextDisabled = true;
      }
    }

    this._calculateRange(this.currentIndex);
    this.pageChanged.emit(this.currentIndex);
  }

  /** calculates number of all results when total amount of records is unknown
   * @param newBatchCount
   */
  calculateNumberOfAllResults(newBatchCount: number) {
    this.numberOfAllResults = this.currentIndex * PagerComponent.pageSize + newBatchCount;
  }

  /**
   * @param page offset
   */
  private _calculateRange(page: number) {
    this.currentRangeStart = PagerComponent.pageSize * page + 1;
    this.currentRangeEnd =
      PagerComponent.pageSize * (page + 1) > this.numberOfAllResults
        ? this.numberOfAllResults
        : PagerComponent.pageSize * (page + 1);

    this._cd.markForCheck();
  }
}
