import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * A card rendered by {@link GridComponent}.
 *
 * `title`, `text` and `urlText` are passed through the `translate` pipe, so they
 * should be translation keys. Values that are not keys (e.g. a title carrying a
 * version number) are rendered verbatim, because the pipe echoes back anything
 * it cannot resolve.
 */
export interface GridItem {
  icon?: string;
  title: string;
  url?: string;
  urlText?: string;
  text: string;
}

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  imports: [MatButtonModule, MatIconModule, RouterLink, RouterLinkActive, TranslatePipe],
})
export class GridComponent {
  @Input({ required: true }) list!: GridItem[];
}
