import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dasch-swiss-app-incoming-resource-pager',
  imports: [MatIconModule, MatButtonModule, TranslateModule],
  templateUrl: './incoming-resource-pager.component.html',
  styleUrls: ['./incoming-resource-pager.component.scss'],
})
export class IncomingResourcePagerComponent {
  @Input() pageSize = 25;
  @Input() lastItemOfPage = 0;
  @Output() pageChanged: EventEmitter<number> = new EventEmitter<number>();

  private _pageIndex = 0;

  get pageIndex(): number {
    return this._pageIndex;
  }

  get isLastOnPage(): boolean {
    return this.lastItemOfPage !== undefined && this.lastItemOfPage < this.pageSize;
  }

  get itemRangeStart(): number {
    return this.pageSize * this._pageIndex + 1;
  }

  get itemRangeEnd(): number {
    return this.lastItemOfPage ? this.lastItemOfPage : this.pageSize * (this._pageIndex + 1);
  }

  changePage(dir: 1 | -1) {
    this._pageIndex += dir;
    this.pageChanged.emit(dir);
  }
}
