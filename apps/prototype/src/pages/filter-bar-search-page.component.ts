import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceBrowserComponent } from '@dasch-swiss/vre/pages/data-browser';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { CenteredLayoutComponent, CenteredBoxComponent, CenteredMessageComponent } from '@dasch-swiss/vre/ui/ui';
import { FilterBarComponent, FilterCondition } from '../components/filter-bar.component';
import {
  INCUNABULA_ONTOLOGY,
  RESOURCE_CLASSES,
  PROPERTIES_BY_CLASS,
  BOOK_PROPERTIES,
  MOCK_SEARCH_RESULTS,
  ALL_PROPERTIES,
  MockOntology,
  MockProperty,
  MockResourceClass,
} from '../mock-data';

/** Create mock ReadResource instances from our fixture data */
function createMockReadResources(): ReadResource[] {
  return MOCK_SEARCH_RESULTS.map(mock => {
    const res = new ReadResource();
    res.id = mock.iri;
    res.label = mock.label;
    res.type = `http://0.0.0.0:3333/ontology/0803/incunabula/v2#${mock.resourceClassLabel.toLowerCase()}`;
    res.attachedToProject = 'http://rdfh.ch/projects/0803';
    res.properties = {};
    return res;
  });
}

@Component({
  selector: 'proto-filter-bar-search-page',
  standalone: true,
  imports: [
    CommonModule,
    CenteredBoxComponent,
    CenteredLayoutComponent,
    CenteredMessageComponent,
    FilterBarComponent,
    MatIconModule,
    MatProgressSpinnerModule,
    ResourceBrowserComponent,
  ],
  providers: [ResourceResultService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Variant toggle — floating in top-right near version badge -->
    <div class="variant-switch">
      <span class="variant-label active">A: Popover</span>
      <span class="variant-divider">|</span>
      <a class="variant-label" (click)="onVariantChange('b')">B: Cascading</a>
    </div>

    <!-- Filter bar — full width, above the centered content -->
    <proto-filter-bar
      [ontologies]="ontologies"
      [resourceClasses]="resourceClasses"
      [properties]="availableProperties"
      [selectedOntology]="selectedOntology"
      [selectedResourceClass]="selectedResourceClass"
      [conditions]="conditions"
      [sortBy]="sortBy"
      [isStale]="isStale"
      [canSearch]="canSearch"
      (ontologySelected)="onOntologySelected($event)"
      (resourceClassSelected)="onResourceClassSelected($event)"
      (conditionAdded)="onConditionAdded()"
      (conditionRemoved)="onConditionRemoved($event)"
      (conditionPropertyChanged)="onConditionPropertyChanged($event)"
      (conditionOperatorChanged)="onConditionOperatorChanged($event)"
      (conditionValueChanged)="onConditionValueChanged($event)"
      (sortByChanged)="onSortByChanged($event)"
      (searchTriggered)="onSearch()">
    </proto-filter-bar>

    <!-- Results area -->
    <div class="results-area">
      @if (isLoading) {
        <app-centered-box>
          <mat-spinner diameter="36"></mat-spinner>
        </app-centered-box>
      } @else if (hasSearched && readResources.length === 0) {
        <app-centered-box>
          <app-centered-message
            icon="search_off"
            title="No results found"
            message="No resources found matching your search criteria. Try broadening your search by removing conditions." />
        </app-centered-box>
      } @else if (!hasSearched) {
        <app-centered-box>
          <app-centered-message
            icon="filter_list"
            title="Build your query"
            message="Select an ontology and resource class, then add property conditions and click Search." />
        </app-centered-box>
      } @else {
        <!-- Real ResourceBrowserComponent with split view -->
        <app-resource-browser
          [data]="{ resources: readResources, selectFirstResource: true }"
          [showBackToFormButton]="false" />
      }
    </div>

    <!-- Screen reader live region -->
    <div aria-live="polite" class="sr-only">{{ announcement }}</div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .variant-switch {
      position: fixed;
      top: 12px;
      right: 420px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 3px 8px;
    }

    .variant-label {
      color: rgba(0, 0, 0, 0.5);
      cursor: pointer;
      text-decoration: none;

      &.active {
        font-weight: 600;
        color: rgba(0, 0, 0, 0.8);
        cursor: default;
      }

      &:not(.active):hover {
        color: #336790;
      }
    }

    .variant-divider {
      color: rgba(0, 0, 0, 0.2);
    }

    .results-area {
      flex: 1;
      overflow: hidden;
    }

    app-resource-browser {
      display: block;
      height: 100%;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  `],
})
export class FilterBarSearchPageComponent {
  // State
  ontologies: MockOntology[] = [INCUNABULA_ONTOLOGY];
  resourceClasses: MockResourceClass[] = [];
  availableProperties: MockProperty[] = [];
  selectedOntology: MockOntology | null = null;
  selectedResourceClass: MockResourceClass | null = null;
  conditions: FilterCondition[] = [];
  readResources: ReadResource[] = [];
  sortBy: string | null = null;
  isStale = false;
  isLoading = false;
  hasSearched = false;
  announcement = '';

  private _conditionId = 0;

  get canSearch(): boolean {
    if (!this.selectedOntology) return false;
    if (!this.selectedResourceClass && this.conditions.length === 0) return false;
    return true;
  }

  constructor(private _cdr: ChangeDetectorRef, private _router: Router, private _route: ActivatedRoute) {
    if (this.ontologies.length === 1) {
      this.onOntologySelected(this.ontologies[0]);
    }
  }

  onVariantChange(variant: string): void {
    if (variant === 'b') {
      this._router.navigate(['../advanced-search-b'], { relativeTo: this._route });
    }
  }

  onOntologySelected(onto: MockOntology): void {
    this.selectedOntology = onto;
    this.selectedResourceClass = null;
    this.conditions = [];
    this.resourceClasses = RESOURCE_CLASSES;
    this.availableProperties = ALL_PROPERTIES;
    this._markStale();
    this._announce(`Ontology "${onto.label}" selected`);
  }

  onResourceClassSelected(rc: MockResourceClass | null): void {
    this.selectedResourceClass = rc;
    this.conditions = [];
    this.availableProperties = rc ? (PROPERTIES_BY_CLASS[rc.iri] || []) : ALL_PROPERTIES;
    this._markStale();
    this._announce(rc ? `Resource class "${rc.label}" selected` : 'All resource classes selected');
  }

  onConditionAdded(): void {
    const condition: FilterCondition = {
      id: `c${++this._conditionId}`,
      property: null,
      operator: null,
      value: null,
    };
    this.conditions = [...this.conditions, condition];
    this._markStale();
    this._announce(`New condition added. ${this.conditions.length} active filters.`);
  }

  onConditionRemoved(condition: FilterCondition): void {
    this.conditions = this.conditions.filter(c => c.id !== condition.id);
    this._markStale();
    this._announce(`Filter removed. ${this.conditions.length} active filters.`);
  }

  onConditionPropertyChanged(event: { condition: FilterCondition; property: MockProperty }): void {
    this.conditions = this.conditions.map(c =>
      c.id === event.condition.id
        ? { ...c, property: event.property, operator: null, value: null }
        : c
    );
    this._markStale();
  }

  onConditionOperatorChanged(event: { condition: FilterCondition; operator: string }): void {
    this.conditions = this.conditions.map(c => {
      if (c.id !== event.condition.id) return c;
      const updated = { ...c, operator: event.operator, value: null };
      // When "matches" is selected on a link property, initialize sub-conditions
      if (event.operator === 'matches' && c.property?.isLinkedResourceProperty) {
        const targetClass = RESOURCE_CLASSES.find(rc => rc.iri === c.property!.objectType);
        updated.linkedResourceClass = targetClass || null;
        updated.subConditions = [];
      } else {
        updated.linkedResourceClass = undefined;
        updated.subConditions = undefined;
      }
      return updated;
    });
    this._markStale();
  }

  onConditionValueChanged(event: { condition: FilterCondition; value: string }): void {
    this.conditions = this.conditions.map(c =>
      c.id === event.condition.id ? { ...c, value: event.value } : c
    );
    this._markStale();
  }

  onSortByChanged(label: string | null): void {
    this.sortBy = label;
    this._markStale();
  }

  onSearch(): void {
    this.isLoading = true;
    this.hasSearched = true;
    this.isStale = false;
    this._cdr.markForCheck();

    // Simulate API latency, then return mock ReadResource objects
    setTimeout(() => {
      this.readResources = createMockReadResources();
      this.isLoading = false;
      this._cdr.markForCheck();
      this._announce(`${this.readResources.length} results found.`);
    }, 600);
  }

  private _markStale(): void {
    if (this.hasSearched) this.isStale = true;
  }

  private _announce(msg: string): void {
    this.announcement = '';
    setTimeout(() => {
      this.announcement = msg;
      this._cdr.markForCheck();
    }, 50);
  }
}
