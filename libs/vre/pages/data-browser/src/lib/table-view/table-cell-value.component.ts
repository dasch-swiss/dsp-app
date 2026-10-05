import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  TemplateRef,
} from '@angular/core';
import { ReadValue, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { TemplateViewerSwitcherComponent } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { viewerCanRender } from './viewer-template-support';

/**
 * One value of one table cell, rendered the way the resource viewer renders it.
 *
 * The mechanism is the viewer's, not a copy of it: `TemplateViewerSwitcherComponent` declares a
 * template per value type, reports the one that fits, and the cell plays it back through
 * `ngTemplateOutlet` — which is precisely what `PropertyValueDisplayComponent` does in the panel
 * beside the table. A date therefore arrives with its calendar, a list value as the path through
 * its list, a link as a link, a boolean as a toggle and a colour as a swatch, instead of as the
 * `strval` dsp-api happens to ship for it.
 *
 * None of the editing chrome comes with it. The viewer's display component also carries the hover
 * action bubble, the delete dialog and the comment line; a cell has one affordance, which opens
 * `TableRowEditHostComponent` over the whole cell, and a second set of per-value controls inside
 * a 200-pixel column would compete with it.
 *
 * Presentational and `@Input`-driven rather than signal-driven, deliberately: the switcher reports
 * its template through an `@Output` fired in `ngAfterViewInit`, which has to be taken as it comes
 * and committed with `detectChanges` — the same dance, for the same reason, as in the viewer.
 */
@Component({
  selector: 'app-table-cell-value',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TemplateViewerSwitcherComponent],
  template: `
    @if (viewerDefinition) {
      <app-template-viewer-switcher
        [myPropertyDefinition]="viewerDefinition"
        [value]="value"
        (templateFound)="onTemplateFound($event)" />
    }

    @if (template) {
      <ng-container *ngTemplateOutlet="template; context: { item: value, index: index }"></ng-container>
    } @else if (!viewerDefinition) {
      <span data-cy="cell-value-text">{{ value.strval }}</span>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        /* Without this a long value stretches its column past the width the layout fixed for it,
           because a flex item's default minimum size is its content. */
        min-width: 0;
      }
    `,
  ],
})
export class TableCellValueComponent implements OnChanges {
  @Input({ required: true }) value!: ReadValue;
  /**
   * The column's property definition. Undefined for a column the ontology had none for, which
   * sends the value down the plain-text path rather than leaving the cell blank.
   */
  @Input({ required: true }) propertyDefinition!: ResourcePropertyDefinitionWithAllLanguages | undefined;
  /**
   * This value's position among the property's values.
   *
   * Nothing the switcher renders reads it today, but it is half of the context the viewer passes
   * and the templates are the viewer's — a template that starts using it must behave the same in
   * both places.
   */
  @Input() index = 0;

  /**
   * The definition to hand the switcher, or `null` when the switcher must not be mounted at all.
   *
   * A separate field rather than a call in the template so the guard runs once per input change
   * instead of once per change-detection pass: a page of a wide class is a thousand of these.
   */
  protected viewerDefinition: ResourcePropertyDefinitionWithAllLanguages | null = null;
  protected template?: TemplateRef<unknown>;

  private readonly _cd = inject(ChangeDetectorRef);

  ngOnChanges() {
    this.viewerDefinition = viewerCanRender(this.propertyDefinition, this.value)
      ? (this.propertyDefinition as ResourcePropertyDefinitionWithAllLanguages)
      : null;
  }

  /**
   * `detectChanges`, not `markForCheck`: the switcher emits from its own `ngAfterViewInit`, so
   * this view has already been checked in the pass that is still running, and merely marking it
   * dirty leaves dev mode's verification pass to find `template` changed — the
   * ExpressionChangedAfterItHasBeenChecked error.
   */
  protected onTemplateFound(template: TemplateRef<unknown>) {
    this.template = template;
    this._cd.detectChanges();
  }
}
