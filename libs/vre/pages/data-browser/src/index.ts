// Pure resource browser component - used by search library
export { ResourceBrowserComponent } from './lib/comparison/resource-browser.component';

// Child components used by ResourceBrowserComponent
export { ResourcesListComponent } from './lib/list-view/resources-list.component';
export { MultipleViewerComponent } from './lib/comparison/multiple-viewer.component';
export { ResourceListSelectionComponent } from './lib/list-view/resource-list-selection.component';

// Service used by ResourceBrowserComponent
export { MultipleViewerService } from './lib/comparison/multiple-viewer.service';
export * from './lib/resource-class-count.api';

export { DataTableComponent } from './lib/table-view/data-table.component';
export { ColumnResizeDirective } from './lib/table-view/column-resize.directive';
export { buildColumnModel, imageColumn, rightsColumns } from './lib/table-view/build-column-model';
export * from './lib/table-view/table-column.model';

export { TableViewOptionsComponent } from './lib/table-view/table-view-options.component';
export type { ViewOptionsEntry } from './lib/table-view/table-view-options.component';
export { TableViewStateService } from './lib/table-view/table-view-state.service';
