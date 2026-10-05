export * from './lib/single-resource-page.component';
export * from './lib/resource-fetcher.component';
export * from './lib/resource-fetcher-dialog.component';
export * from './lib/properties/properties-display/template-switcher/create-resource-dialog.component';

// Mounted across the lib boundary by the Data tab's table view (DEV-7466): a table cell is edited
// by hosting the resource editor's own property editor rather than by reimplementing one, so that
// validation, cardinality rules, comments and the write path cannot drift between the two surfaces.
//
// Deliberately narrow. `PropertyValuesComponent` is the mountable unit; the two services are the
// ones its subtree injects but does not provide for itself, so a host that omits either gets a
// runtime `NullInjectorError` rather than a compile error — `PropertiesDisplayService` especially,
// which carries no `@Injectable()` at all. `ResourceUtil` is the permission predicate the editor
// itself applies, and the table must apply the same one to decide whether a cell is editable.
export { PropertyValuesComponent } from './lib/properties/properties-display/property-value/property-values.component';
export { PropertiesDisplayService } from './lib/properties/properties-display/property-value/properties-display.service';
export { ResourceFetcherService } from './lib/representation/resource-fetcher.service';
export { ResourceUtil } from './lib/representation/resource.util';

// The drawer-dialog open control. Shared with the data browser's table so a row opens a resource
// exactly the way the rest of the app does, rather than growing a second way to do it.
export { ResourceExplorerButtonComponent } from './lib/properties/resource-explorer-button.component';
