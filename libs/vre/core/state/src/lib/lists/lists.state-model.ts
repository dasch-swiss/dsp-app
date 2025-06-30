import { ListNodeInfo } from '@dasch-swiss/dsp-js';

export class ListsStateModel {
  isLoading = false;
  isLoaded = false;
  listsInProject: ListNodeInfo[] = []; // before it was currentOntologyLists
}
