import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ShortResInfo } from '../results/list-view/list-view.component';
import { SplitSize } from '../results/results.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.scss'],
})
export class ComparisonComponent implements OnChanges {
  /**
   * number of resources
   */
  @Input() noOfResources?: number;

  /**
   * resource ids
   */
  @Input() resourceIds?: string[];

  /**
   * list of resources with id and label
   */
  @Input() resources?: ShortResInfo[];

  // parent (or own) split size changed
  @Input() splitSizeChanged: SplitSize;

  // if number of selected resources > 3, divide them into 2 rows
  topRow: string[] = [];
  bottomRow: string[] = [];

  ngOnChanges(): void {
    if (this.resources && this.resources.length) {
      this.resourceIds = this.resources.map(res => res.id);
    }

    if (!this.noOfResources) {
      this.noOfResources =
        this.resourceIds && this.resourceIds.length ? this.resourceIds.length : this.resources.length;
    }

    // if number of resources are more than 3, divide it into 2 rows
    // otherwise display then in 1 row only
    if (this.noOfResources < 4) {
      this.topRow = this.resourceIds;
    } else {
      this.topRow = this.resourceIds.slice(0, this.noOfResources / 2);
      this.bottomRow = this.resourceIds.slice(this.noOfResources / 2);
    }
  }
}
