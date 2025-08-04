import { DataModelsComponent } from './lib/data-models/data-models.component';
import { OntologyFormComponent } from './lib/forms/ontology-form/ontology-form.component';
import { EditPropertyFormDialogComponent } from './lib/forms/property-form/edit-property-form-dialog.component';
import { GuiAttrLinkComponent } from './lib/forms/property-form/gui-attr-link.component';
import { GuiAttrListComponent } from './lib/forms/property-form/gui-attr-list.component';
import { PropertyFormComponent } from './lib/forms/property-form/property-form.component';
import { CreateResourceClassDialogComponent } from './lib/forms/resource-class-form/create-resource-class-dialog.component';
import { EditResourceClassDialogComponent } from './lib/forms/resource-class-form/edit-resource-class-dialog.component';
import { ResourceClassFormComponent } from './lib/forms/resource-class-form/resource-class-form.component';
import { OntologyEditorHeaderComponent } from './lib/ontology-editor-header.component';
import { OntologyPageComponent } from './lib/ontology-page.component';
import { OntologySidenavComponent } from './lib/ontology-sidenav.component';
import { OntologyPropertiesComponent } from './lib/properties/ontology-properties.component';
import { PropertyInfoComponent } from './lib/properties/property-info/property-info.component';
import { OntologyEditorClassesComponent } from './lib/resource-classes/ontology-editor-classes.component';
import { AddPropertyMenuComponent } from './lib/resource-classes/resource-class-info/add-property-menu.component';
import { CardinalityChangeDialogComponent } from './lib/resource-classes/resource-class-info/cardinality-component/cardinality-change-dialog.component';
import { CardinalityComponent } from './lib/resource-classes/resource-class-info/cardinality-component/cardinality.component';
import { PropertyItemComponent } from './lib/resource-classes/resource-class-info/property-item.component';
import { ResourceClassInfoComponent } from './lib/resource-classes/resource-class-info/resource-class-info.component';

export const OntologyComponents = [
  DataModelsComponent,
  CreateResourceClassDialogComponent,
  EditResourceClassDialogComponent,
  OntologyFormComponent,
  OntologyPageComponent,
  OntologyEditorHeaderComponent,
  OntologyEditorClassesComponent,
  OntologyPropertiesComponent,
  PropertyInfoComponent,
  ResourceClassFormComponent,
  AddPropertyMenuComponent,
  ResourceClassInfoComponent,
  PropertyItemComponent,
  CardinalityComponent,
  CardinalityChangeDialogComponent,
  EditPropertyFormDialogComponent,
  GuiAttrLinkComponent,
  GuiAttrListComponent,
  PropertyFormComponent,
  OntologySidenavComponent,
];
