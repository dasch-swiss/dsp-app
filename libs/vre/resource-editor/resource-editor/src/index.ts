export * from './lib/single-resource-page.component';
export * from './lib/resource-fetcher.component';
export * from './lib/resource-fetcher-dialog.component';
export * from './lib/properties/properties-display/template-switcher/create-resource-dialog.component';

// `PropertyValuesComponent` is the mountable unit; a host must provide the services below that its subtree
// injects but does not provide itself, or it gets a runtime `NullInjectorError`.
// `ResourceFetcherService` must be primed per resource (see its `prime`).
export { PropertyValuesComponent } from './lib/properties/properties-display/property-value/property-values.component';
export { EditableResourceLabelComponent } from './lib/header/editable-resource-label.component';
export { EditableResourceAuthorshipComponent } from './lib/properties/editable-resource-authorship.component';
export { VALUE_ACTIONS_OPTIONS } from './lib/properties/properties-display/property-value/value-actions-options.token';
export { PropertiesDisplayService } from './lib/properties/properties-display/property-value/properties-display.service';
export { ResourceFetcherService } from './lib/representation/resource-fetcher.service';
export { RepresentationService } from './lib/representation/representation.service';
export { FootnoteService } from './lib/properties/properties-display/footnotes/footnote.service';

export { ResourceExplorerButtonComponent } from './lib/properties/resource-explorer-button.component';
