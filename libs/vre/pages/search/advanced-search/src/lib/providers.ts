import { Provider } from '@angular/core';
import { DynamicFormsDataService } from './service/dynamic-forms-data.service';
import { GravsearchService } from './service/gravsearch.service';
import { OntologyDataService } from './service/ontology-data.service';
import { PropertyFormManager } from './service/property-form.manager';
import { QueryExecutionService } from './service/query-execution.service';
import { SearchDerivationService } from './service/search-derivation.service';
import { SearchFlowLogger } from './service/search-flow-logger.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';

export function provideAdvancedSearch(): Provider[] {
  return [
    PropertyFormManager,
    OntologyDataService,
    DynamicFormsDataService,
    GravsearchService,
    QueryExecutionService,
    SearchUrlSyncService,
    SearchDerivationService,
    SearchFlowLogger,
  ];
}
