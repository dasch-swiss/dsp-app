import { Provider } from '@angular/core';
import { DynamicFormsDataService } from './service/dynamic-forms-data.service';
import { GravsearchService } from './service/gravsearch.service';
import { OntologyDataService } from './service/ontology-data.service';
import { OrderByService } from './service/order-by.service';
import { PropertyFormManager } from './service/property-form.manager';
import { QueryExecutionService } from './service/query-execution.service';
import { SearchFlowLogger } from './service/search-flow-logger.service';
import { SearchStateService } from './service/search-state.service';
import { SearchUrlSyncService } from './service/search-url-sync.service';

export function provideAdvancedSearch(): Provider[] {
  return [
    SearchStateService,
    OrderByService,
    PropertyFormManager,
    OntologyDataService,
    DynamicFormsDataService,
    GravsearchService,
    QueryExecutionService,
    SearchUrlSyncService,
    SearchFlowLogger,
  ];
}
