// Pure resource browser component - used by search library
export { ResourceBrowserComponent } from './lib/comparison/resource-browser.component';

// Child components used by ResourceBrowserComponent
export { ResourcesListComponent } from './lib/list-view/resources-list.component';
export { ResultCountComponent } from './lib/list-view/result-count.component';
export { MultipleViewerComponent } from './lib/comparison/multiple-viewer.component';

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
