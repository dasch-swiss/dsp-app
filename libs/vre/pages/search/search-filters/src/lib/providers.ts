import { Provider } from '@angular/core';
import { ConfirmedSearchStateService } from './service/confirmed-search-state.service';
import { DynamicFormsDataService } from './service/dynamic-forms-data.service';
import { FilterEditorRequestService } from './service/filter-editor-request.service';
import { GravsearchService } from './service/gravsearch.service';
import { ListNodeLabelResolver } from './service/list-node-label.resolver';
import { OntologyDataService } from './service/ontology-data.service';
import { SearchFlowLogger } from './service/search-flow-logger.service';
import { StatementDraftStore } from './service/statement-draft.store';

/** Everything the chip bar needs except a `SearchFilterState`, which the hosting page provides. */
export function provideSearchFilters(): Provider[] {
  return [
    StatementDraftStore,
    ConfirmedSearchStateService,
    OntologyDataService,
    DynamicFormsDataService,
    FilterEditorRequestService,
    GravsearchService,
    ListNodeLabelResolver,
    SearchFlowLogger,
  ];
}
