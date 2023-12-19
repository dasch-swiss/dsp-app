import { ListNodeInfo } from '@dasch-swiss/dsp-js';

export class ListsStateModel {
  isLoading = false;
  listsInProject: ListNodeInfo[] = []; // before it was currentOntologyLists
}
