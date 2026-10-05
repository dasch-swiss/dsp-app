export * from './lib/single-resource-page.component';
export * from './lib/resource-fetcher.component';
export * from './lib/resource-fetcher-dialog.component';
export * from './lib/properties/properties-display/template-switcher/create-resource-dialog.component';

// Mounted across the lib boundary by the Data tab's table view (DEV-7466): every editable cell of
// the table *is* this unit, so the value a cell shows, the hover action bubble, the editor, the
// delete dialog, the add control and the write path cannot drift between the grid and the panel
// beside it.
//
// Deliberately narrow. `PropertyValuesComponent` is the mountable unit; the three services are
// the ones its subtree injects but does not provide for itself, so a host that omits any of them
// gets a runtime `NullInjectorError` rather than a compile error — `PropertiesDisplayService`
// especially, which carries no `@Injectable()` at all. `ResourceFetcherService` must be primed
// per resource (see its `prime`), the other two may be shared by the whole host.
export { PropertyValuesComponent } from './lib/properties/properties-display/property-value/property-values.component';
export { PropertiesDisplayService } from './lib/properties/properties-display/property-value/properties-display.service';
export { ResourceFetcherService } from './lib/representation/resource-fetcher.service';
export { FootnoteService } from './lib/properties/properties-display/footnotes/footnote.service';

// The drawer-dialog open control. Shared with the data browser's table so a row opens a resource
// exactly the way the rest of the app does, rather than growing a second way to do it.
export { ResourceExplorerButtonComponent } from './lib/properties/resource-explorer-button.component';
