import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FilterChipBarComponent } from './ui/chip-bar/filter-chip-bar.component';

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [FilterChipBarComponent],
  // The query is derived from the URL by the page (DEV-6576 Phase 3c); the old `gravsearchQuery`
  // output push chain is retired (Phase 3d). This wrapper just hosts the chip bar.
  template: `<app-filter-chip-bar [projectUuid]="projectUuid" />`,
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent {
  @Input({ required: true }) projectUuid!: string;
}
