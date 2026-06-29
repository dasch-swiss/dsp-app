import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterChipBarComponent } from './ui/chip-bar/filter-chip-bar.component';

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [FilterChipBarComponent],
  template: `<app-filter-chip-bar [projectUuid]="projectUuid" (gravsearchQuery)="gravsearchQuery.emit($event)" />`,
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent {
  @Input({ required: true }) projectUuid!: string;
  @Output() gravsearchQuery = new EventEmitter<string | null>();
}
