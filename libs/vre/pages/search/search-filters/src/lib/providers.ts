import { Provider } from '@angular/core';
import { ConfirmedSearchStateService } from './service/confirmed-search-state.service';
import { DynamicFormsDataService } from './service/dynamic-forms-data.service';
import { GravsearchService } from './service/gravsearch.service';
import { ListNodeLabelResolver } from './service/list-node-label.resolver';
import { OntologyDataService } from './service/ontology-data.service';
import { SearchFlowLogger } from './service/search-flow-logger.service';
import { StatementDraftStore } from './service/statement-draft.store';

/**
 * Everything the chip bar needs, minus the one thing it cannot supply itself: a `SearchFilterState`.
 * The hosting page provides that, which is what lets the Search tab and the Data tab share this whole
 * stack while disagreeing about where search state is stored.
 */
export function provideSearchFilters(): Provider[] {
  return [
    StatementDraftStore,
    ConfirmedSearchStateService,
    OntologyDataService,
    DynamicFormsDataService,
    GravsearchService,
    ListNodeLabelResolver,
    SearchFlowLogger,
  ];
}
