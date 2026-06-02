import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { OntologyDataService } from './service/ontology-data.service';
import { FilterChipBarComponent } from './ui/chip-bar/filter-chip-bar.component';

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [FilterChipBarComponent],
  template: `<app-filter-chip-bar [projectUuid]="projectUuid" (gravsearchQuery)="gravsearchQuery.emit($event)" />`,
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent implements OnInit {
  @Input({ required: true }) projectUuid!: string;
  @Output() gravsearchQuery = new EventEmitter<string | null>();

  private readonly _dataService = inject(OntologyDataService);

  get projectIri(): string {
    return `http://rdfh.ch/projects/${this.projectUuid}`;
  }

  ngOnInit(): void {
    this._dataService.init(this.projectIri);
  }
}
