import { AnnotationTabComponent } from './lib/annotation-tab.component';
import { AnnotationToolbarComponent } from './lib/annotation-toolbar.component';
import { CompoundArrowNavigationComponent } from './lib/compound/compound-arrow-navigation.component';
import { CompoundNavigationComponent } from './lib/compound/compound-navigation.component';
import { CompoundSliderComponent } from './lib/compound/compound-slider.component';
import { CompoundViewerComponent } from './lib/compound/compound-viewer.component';
import { PermissionInfoComponent } from './lib/permission-info/permission-info.component';
import { ResourceFetcherComponent } from './lib/resource-fetcher.component';
import { ResourceHeaderComponent } from './lib/resource-header.component';
import { ResourcePageComponent } from './lib/resource-page.component';
import { ResourceRepresentationComponent } from './lib/resource-representation.component';
import { ResourceRestrictionComponent } from './lib/resource-restriction.component';
import { ResourceTabsComponent } from './lib/resource-tabs.component';
import { ResourceToolbarComponent } from './lib/resource-toolbar.component';
import { ResourceComponent } from './lib/resource.component';
import { SegmentTabComponent } from './lib/segment-tab.component';
import { SingleResourcePageComponent } from './lib/single-resource-page.component';

const CompoundComponents = [
  CompoundArrowNavigationComponent,
  CompoundNavigationComponent,
  CompoundSliderComponent,
  CompoundViewerComponent,
];
export const ResourcePageComponents = [
  ...CompoundComponents,
  ResourceComponent,
  ResourceHeaderComponent,
  ResourcePageComponent,
  SingleResourcePageComponent,
  ResourceFetcherComponent,
  ResourceRepresentationComponent,
  ResourceTabsComponent,
  ResourceToolbarComponent,
  AnnotationToolbarComponent,
  AnnotationTabComponent,
  SegmentTabComponent,
  PermissionInfoComponent,
  ResourceRestrictionComponent,
];
