import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
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
  linkedResourceClass?: MockResourceClass | null;
  subConditions?: FilterCondition[];
}

@Component({
  selector: 'proto-filter-bar-b',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatMenuModule, MatSelectModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, ColorPickerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-bar-b.component.html',
  styleUrls: ['./filter-bar-b.component.scss'],
})
export class FilterBarVariantBComponent implements OnChanges {
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
  private _elRef = inject(ElementRef);

  @ViewChild('addMenuTrigger') addMenuTrigger!: MatMenuTrigger;

  // For inline value editing
  editingValueConditionId: string | null = null;
  editingValueText: string = '';

  private _previousConditionCount = 0;

  // Pending value from cascade — the cascade creates a condition via add+property+operator,
  // then if a value is needed, we auto-open the value editor
  private _pendingValueConditionId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conditions']) {
      const newConditions: FilterCondition[] = changes['conditions'].currentValue;
      // If a condition was just completed by cascade and needs a value, open value editor
      if (this._pendingValueConditionId) {
        const cond = newConditions.find(c => c.id === this._pendingValueConditionId);
        if (cond && cond.operator && this.needsValueInput(cond.operator)) {
          this.editingValueConditionId = cond.id;
          this.editingValueText = cond.value || '';
        }
        this._pendingValueConditionId = null;
      }
      this._previousConditionCount = newConditions.length;
    }
  }

  getOperators(property: MockProperty | null): string[] {
    if (!property) return [];
    return getOperatorsForType(property.objectType);
  }

  getPropertyIcon(prop: MockProperty): string {
    return getIconForProperty(prop);
  }

  needsValueInput(operator: string | null): boolean {
    return !!operator && operator !== 'exists' && operator !== 'does not exist';
  }

  needsValueInputForProperty(operator: string | null, property: MockProperty | null): boolean {
    if (!operator) return false;
    if (operator === 'matches' && property?.isLinkedResourceProperty) return false;
    return this.needsValueInput(operator);
  }

  formatChipLabel(condition: FilterCondition): string {
    const parts: string[] = [];
    if (condition.property) parts.push(condition.property.label);
    if (condition.operator) parts.push(condition.operator);
    if (condition.value) parts.push(condition.value);
    return parts.join(' ') || 'New condition...';
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

  getLinkedResourceClasses(property: MockProperty | null): MockResourceClass[] {
    if (!property || !property.isLinkedResourceProperty) return [];
    const targetClass = RESOURCE_CLASSES.find(rc => rc.iri === property.objectType);
    return targetClass ? [targetClass] : RESOURCE_CLASSES;
  }

  getLinkedClassProperties(resourceClass: MockResourceClass | null): MockProperty[] {
    if (!resourceClass) return [];
    return PROPERTIES_BY_CLASS[resourceClass.iri] || [];
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
    this._cdr.markForCheck();
    // Auto-open the property menu on the new sub-condition after it renders
    setTimeout(() => {
      const placeholder = this._elRef.nativeElement.querySelector(`.matches-body .chip-placeholder`) as HTMLElement;
      if (placeholder) placeholder.click();
    }, 150);
  }

  removeSubCondition(condition: FilterCondition, sub: FilterCondition): void {
    if (!condition.subConditions) return;
    condition.subConditions = condition.subConditions.filter(s => s.id !== sub.id);
  }

  // --- Cascading add via nested menus ---

  onCascadeSelectProperty(prop: MockProperty): void {
    // Step 1 done — property selected. Operators submenu opens automatically via [matMenuTriggerFor].
    // We store the property temporarily; actual condition is created after operator selection.
  }

  onCascadeComplete(prop: MockProperty, operator: string): void {
    // Create the condition with property + operator in one shot
    this.conditionAdded.emit();
    setTimeout(() => {
      const newCond = this.conditions[this.conditions.length - 1];
      if (newCond) {
        this.conditionPropertyChanged.emit({ condition: newCond, property: prop });
        setTimeout(() => {
          const updated = this.conditions[this.conditions.length - 1];
          if (updated) {
            this.conditionOperatorChanged.emit({ condition: updated, operator });
            // If value is needed, mark for auto-open
            if (this.needsValueInput(operator)) {
              this._pendingValueConditionId = updated.id;
            }
            // For matches on link properties, auto-add a sub-condition
            if (operator === 'matches' && prop.isLinkedResourceProperty) {
              setTimeout(() => {
                const matched = this.conditions.find(c => c.id === updated.id);
                if (matched && matched.subConditions?.length === 0) {
                  this.addSubCondition(matched);
                  this._cdr.markForCheck();
                }
              }, 100);
            }
          }
        });
      }
    });
  }

  onCascadeCompleteWithValue(prop: MockProperty, operator: string, value: string): void {
    if (!value) return;
    this.addMenuTrigger.closeMenu();
    this.conditionAdded.emit();
    setTimeout(() => {
      const newCond = this.conditions[this.conditions.length - 1];
      if (newCond) {
        this.conditionPropertyChanged.emit({ condition: newCond, property: prop });
        setTimeout(() => {
          const updated = this.conditions[this.conditions.length - 1];
          if (updated) {
            this.conditionOperatorChanged.emit({ condition: updated, operator });
            setTimeout(() => {
              const final = this.conditions[this.conditions.length - 1];
              if (final) {
                this.conditionValueChanged.emit({ condition: final, value });
              }
            });
          }
        });
      }
    });
  }

  // --- Inline segment editing (click on chip segments) ---

  onPropertySegmentClick(condition: FilterCondition, menu: any): void {
    // The mat-menu is triggered via [matMenuTriggerFor] on the element
  }

  onChangeProperty(condition: FilterCondition, prop: MockProperty): void {
    this.conditionPropertyChanged.emit({ condition, property: prop });
  }

  onChangeOperator(condition: FilterCondition, operator: string): void {
    this.conditionOperatorChanged.emit({ condition, operator });
  }

  onSegmentValueChanged(condition: FilterCondition, value: string): void {
    this.conditionValueChanged.emit({ condition, value });
  }

  openValueEdit(condition: FilterCondition): void {
    this.editingValueConditionId = condition.id;
    this.editingValueText = condition.value || '';
  }

  confirmValueEdit(condition: FilterCondition): void {
    if (this.editingValueText) {
      this.conditionValueChanged.emit({ condition, value: this.editingValueText });
    }
    this.editingValueConditionId = null;
    this.editingValueText = '';
  }

  cancelValueEdit(): void {
    this.editingValueConditionId = null;
    this.editingValueText = '';
  }
}
