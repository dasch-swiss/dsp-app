import { Selector } from '@ngxs/store';
import { IClassItemsKeyValuePairs } from '../model-interfaces';
import { OntologyClassState } from './ontology-class.state';
import { OntologyClassStateModel } from './ontology-class.state-model';

export class OntologyClassSelectors {
  @Selector([OntologyClassState])
  static isLoading(state: OntologyClassStateModel): boolean | undefined {
    return state.isLoading;
  }

  @Selector([OntologyClassState])
  static classItems(state: OntologyClassStateModel): IClassItemsKeyValuePairs {
    return state.classItems;
  }
}
