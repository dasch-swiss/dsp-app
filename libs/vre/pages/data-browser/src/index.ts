// Pure resource browser component - used by search library
export { ResourceBrowserComponent } from './lib/comparison/resource-browser.component';

// Child components used by ResourceBrowserComponent
export { ResourcesListComponent } from './lib/list-view/resources-list.component';
export { ResultCountComponent } from './lib/list-view/result-count.component';
export { MultipleViewerComponent } from './lib/comparison/multiple-viewer.component';
// The selection banner. Rendered by the Data tab's class view above the split, so it is common to
// the list and the table rather than living inside the panel only one of them has.
export { ResourceListSelectionComponent } from './lib/list-view/resource-list-selection.component';

// Service used by ResourceBrowserComponent
export { MultipleViewerService } from './lib/comparison/multiple-viewer.service';
export * from './lib/resource-class-count.api';

// Table view. The component takes its column model as an input rather than reaching for a service,
// so the Advanced Search results page can adopt it later without a rewrite.
export { DataTableComponent } from './lib/table-view/data-table.component';
export { buildColumnModel } from './lib/table-view/build-column-model';
export { TableLayoutService } from './lib/table-view/table-layout.service';
export type { TableLayout } from './lib/table-view/table-layout.service';
export * from './lib/table-view/table-column.model';

// The column picker and the state it edits. Both cross the lib boundary because the menu is
// rendered by the class header in `vre/pages/project`, above the split, while the table it shapes
// is rendered below it.
export { TableViewOptionsComponent } from './lib/table-view/table-view-options.component';
export { TableViewStateService } from './lib/table-view/table-view-state.service';
export type { ColumnPickerEntry } from './lib/table-view/table-view-state.service';
