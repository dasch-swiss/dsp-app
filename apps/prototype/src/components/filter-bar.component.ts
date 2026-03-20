import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ColorPickerDirective } from 'ngx-color-picker';
import { MockProperty, MockResourceClass, MockOntology, MockListNode, getOperatorsForType, getIconForProperty, LIST_NODES_BY_PROPERTY, PROPERTIES_BY_CLASS, RESOURCE_CLASSES } from '../mock-data';

export interface FilterCondition {
  id: string;
  property: MockProperty | null;
  operator: string | null;
  value: string | null;
  /** For "matches" on link properties: the linked resource class */
  linkedResourceClass?: MockResourceClass | null;
  /** For "matches" on link properties: nested sub-conditions */
  subConditions?: FilterCondition[];
}

@Component({
  selector: 'proto-filter-bar',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatMenuModule, MatSelectModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, ColorPickerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss'],
})
export class FilterBarComponent implements OnChanges {
  @Input() ontologies: MockOntology[] = [];
  @Input() resourceClasses: MockResourceClass[] = [];
  @Input() properties: MockProperty[] = [];
  @Input() selectedOntology: MockOntology | null = null;
  @Input() selectedResourceClass: MockResourceClass | null = null;
  @Input() conditions: FilterCondition[] = [];
  @Input() sortBy: string | null = null;
  @Input() isStale = false;
  @Input() canSearch = false;

  @Output() ontologySelected = new EventEmitter<MockOntology>();
  @Output() resourceClassSelected = new EventEmitter<MockResourceClass | null>();
  @Output() conditionAdded = new EventEmitter<void>();
  @Output() conditionRemoved = new EventEmitter<FilterCondition>();
  @Output() conditionPropertyChanged = new EventEmitter<{ condition: FilterCondition; property: MockProperty }>();
  @Output() conditionOperatorChanged = new EventEmitter<{ condition: FilterCondition; operator: string }>();
  @Output() conditionValueChanged = new EventEmitter<{ condition: FilterCondition; value: string }>();
  @Output() sortByChanged = new EventEmitter<string | null>();
  @Output() searchTriggered = new EventEmitter<void>();

  private _cdr = inject(ChangeDetectorRef);

  editingConditionId: string | null = null;
  private _previousConditionCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conditions']) {
      const newConditions: FilterCondition[] = changes['conditions'].currentValue;
      // Auto-open popover when a new condition is added
      if (newConditions.length > this._previousConditionCount && newConditions.length > 0) {
        this.editingConditionId = newConditions[newConditions.length - 1].id;
      }
      this._previousConditionCount = newConditions.length;
    }
  }

  getOperators(property: MockProperty | null): string[] {
    if (!property) return [];
    return getOperatorsForType(property.objectType);
  }

  toggleEdit(condition: FilterCondition): void {
    this.editingConditionId = this.editingConditionId === condition.id ? null : condition.id;
  }

  closeEdit(): void {
    this.editingConditionId = null;
  }

  formatChipLabel(condition: FilterCondition): string {
    const parts: string[] = [];
    if (condition.property) parts.push(condition.property.label);
    if (condition.operator) parts.push(condition.operator);
    if (condition.value) parts.push(`"${condition.value}"`);
    return parts.join(' ') || 'New condition...';
  }

  getPropertyIcon(prop: MockProperty): string {
    return getIconForProperty(prop);
  }

  needsValueInput(operator: string | null): boolean {
    return !!operator && operator !== 'exists' && operator !== 'does not exist';
  }

  /** Whether this operator+property combo needs a value (matches on link properties doesn't) */
  needsValueInputForCondition(condition: FilterCondition): boolean {
    if (!condition.operator) return false;
    if (condition.operator === 'matches' && condition.property?.isLinkedResourceProperty) return false;
    return this.needsValueInput(condition.operator);
  }

  onOperatorSelected(condition: FilterCondition, operator: string): void {
    this.conditionOperatorChanged.emit({ condition, operator });
    const isMatchesOnLink = operator === 'matches' && condition.property?.isLinkedResourceProperty;
    if (isMatchesOnLink || operator === 'exists' || operator === 'does not exist') {
      this.closeEdit();
      if (isMatchesOnLink) {
        setTimeout(() => {
          const updated = this.conditions.find(c => c.id === condition.id);
          if (updated && updated.subConditions?.length === 0) {
            this.addSubCondition(updated);
            this._cdr.markForCheck();
          }
        }, 100);
      }
    }
  }

  getValueType(property: MockProperty | null): string {
    if (!property) return 'text';
    const t = property.objectType;
    if (t.includes('TextValue')) return 'text';
    if (t.includes('IntValue')) return 'integer';
    if (t.includes('DecimalValue')) return 'decimal';
    if (t.includes('BooleanValue')) return 'boolean';
    if (t.includes('DateValue')) return 'date';
    if (t.includes('ListValue')) return 'list';
    if (t.includes('UriValue')) return 'uri';
    if (t.includes('ColorValue')) return 'color';
    if (property.isLinkedResourceProperty) return 'link';
    return 'text';
  }

  getListNodes(property: MockProperty | null): MockListNode[] {
    if (!property) return [];
    return LIST_NODES_BY_PROPERTY[property.iri] || [];
  }

  /** For link properties: get the target resource classes */
  getLinkedResourceClasses(property: MockProperty | null): MockResourceClass[] {
    if (!property || !property.isLinkedResourceProperty) return [];
    // The objectType of a link property is the target class IRI
    const targetClass = RESOURCE_CLASSES.find(rc => rc.iri === property.objectType);
    return targetClass ? [targetClass] : RESOURCE_CLASSES;
  }

  /** Get properties available for a linked resource class */
  getLinkedClassProperties(resourceClass: MockResourceClass | null): MockProperty[] {
    if (!resourceClass) return [];
    return PROPERTIES_BY_CLASS[resourceClass.iri] || [];
  }

  /** Get properties for a condition — either parent properties or linked class properties */
  getPropertiesForCondition(condition: FilterCondition): MockProperty[] {
    // Check if this condition is a sub-condition of a matches parent
    for (const c of this.conditions) {
      if (c.subConditions?.some(s => s.id === condition.id)) {
        return this.getLinkedClassProperties(c.linkedResourceClass || null);
      }
    }
    return this.properties;
  }

  isMatchesCondition(condition: FilterCondition): boolean {
    return condition.operator === 'matches' && condition.property?.isLinkedResourceProperty === true;
  }

  private _subConditionId = 0;

  addSubCondition(condition: FilterCondition): void {
    if (!condition.subConditions) condition.subConditions = [];
    const newSub: FilterCondition = {
      id: `sub${++this._subConditionId}`,
      property: null,
      operator: null,
      value: null,
    };
    condition.subConditions = [...condition.subConditions, newSub];
    // Auto-open the popover for the new sub-condition
    this.editingConditionId = newSub.id;
    this._cdr.markForCheck();
  }

  removeSubCondition(condition: FilterCondition, sub: FilterCondition): void {
    if (!condition.subConditions) return;
    condition.subConditions = condition.subConditions.filter(s => s.id !== sub.id);
  }
}
