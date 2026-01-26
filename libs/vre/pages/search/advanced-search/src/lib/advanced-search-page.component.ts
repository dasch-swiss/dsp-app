import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AngularSplitModule, SplitComponent } from 'angular-split';
import { debounceTime, Subject } from 'rxjs';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { AdvancedSearchComponent } from './advanced-search.component';
import { QueryObject } from './model';

@Component({
  selector: 'app-advanced-search-page',
  template: `<as-split
    #split
    class="whole-height"
    [direction]="isVertical() ? 'vertical' : 'horizontal'"
    (dragEnd)="onDragEnd($event)">
    <as-split-area [size]="query ? 50 : 100">
      <div class="search-form-container">
        <div class="search-form-wrapper">
          <app-advanced-search
            class="search-form-content"
            [isVerticalDirection]="query ? isVertical() : undefined"
            (toggleDirection)="toggleDirection()"
            [projectUuid]="uuid"
            (gravesearchQuery)="onSearch($event)"
            (clearQuery)="query = undefined" />
        </div>
      </div>
    </as-split-area>
    @if (query) {
      <as-split-area [size]="50">
        <app-advanced-search-results [query]="query" />
      </as-split-area>
    }
  </as-split>`,
  styleUrls: ['./advanced-search-page.component.scss'],
  imports: [AdvancedSearchComponent, AdvancedSearchResultsComponent, AngularSplitModule],
})
export class AdvancedSearchPageComponent implements AfterViewChecked, OnDestroy {
  private static readonly STORAGE_KEY_DIRECTION = 'advanced-search-split-direction';
  private static readonly STORAGE_KEY_RATIO = 'advanced-search-split-ratio';

  @ViewChild('split') split?: SplitComponent;

  uuid = this._route.parent?.snapshot.params[RouteConstants.uuidParameter] ?? '';
  query?: string;
  isVertical = signal(this.loadDirection());

  private _resizeSubject = new Subject<void>();
  private _needsSplitUpdate = false;
  private _pendingSizes?: [number, number];

  constructor(private readonly _route: ActivatedRoute) {
    if (!this.uuid) {
      console.error('Project UUID not found in route parameters');
    }

    // Debounce resize events
    this._resizeSubject.pipe(debounceTime(300)).subscribe(() => {
      this._handleResize();
    });
  }

  ngAfterViewChecked(): void {
    if (this._needsSplitUpdate && this.split && this.query && this._pendingSizes) {
      this.split.setVisibleAreaSizes(this._pendingSizes);
      this._needsSplitUpdate = false;
      this._pendingSizes = undefined;
    }
  }

  ngOnDestroy(): void {
    this._resizeSubject.complete();
  }

  onSearch(query: string): void {
    this.query = query;
    // Restore saved ratio when query results appear
    const savedRatio = this.loadRatio();
    if (savedRatio) {
      this._pendingSizes = savedRatio;
      this._needsSplitUpdate = true;
    }
  }

  toggleDirection(): void {
    this.isVertical.update(value => {
      const newValue = !value;
      this.saveDirection(newValue);

      // Reset to original ratio after direction change
      if (this.query) {
        const sizes: [number, number] = newValue ? [50, 50] : this.getHorizontalSizes();
        this._pendingSizes = sizes;
        this._needsSplitUpdate = true;
      }

      return newValue;
    });
  }

  onDragEnd(event: { gutterNum: number; sizes: number[] }): void {
    // Save the new ratio when user manually adjusts the split
    if (this.query) {
      this.saveRatio(event.sizes as [number, number]);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this._resizeSubject.next();
  }

  private _handleResize(): void {
    // Only recalculate on resize if in horizontal mode and query exists
    if (!this.isVertical() && this.query && this.split) {
      const sizes = this.getHorizontalSizes();
      this.split.setVisibleAreaSizes(sizes);
      this.saveRatio(sizes);
    }
  }

  private getHorizontalSizes(): [number, number] {
    const screenWidth = window.innerWidth;
    const firstColumnSize = screenWidth < 1980 ? 33 : 25;
    return [firstColumnSize, 100 - firstColumnSize];
  }

  private loadDirection(): boolean {
    const stored = localStorage.getItem(AdvancedSearchPageComponent.STORAGE_KEY_DIRECTION);
    return stored !== null ? stored === 'vertical' : true;
  }

  private saveDirection(isVertical: boolean): void {
    localStorage.setItem(AdvancedSearchPageComponent.STORAGE_KEY_DIRECTION, isVertical ? 'vertical' : 'horizontal');
  }

  private loadRatio(): [number, number] | null {
    const stored = localStorage.getItem(AdvancedSearchPageComponent.STORAGE_KEY_RATIO);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 2) {
          return parsed as [number, number];
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  private saveRatio(sizes: [number, number]): void {
    localStorage.setItem(AdvancedSearchPageComponent.STORAGE_KEY_RATIO, JSON.stringify(sizes));
  }
}
