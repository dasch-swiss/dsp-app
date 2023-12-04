import { ReadGroup, ReadProject, ReadUser } from "@dasch-swiss/dsp-js";
import { IKeyValuePairs } from "../model-interfaces";
 
export class CurrentProjectStateModel {
    isLoading = false;
    hasLoadingErrors = false;
    project: ReadProject | undefined;
    isProjectAdmin = false;
    isProjectMember = false;
    groups: ReadGroup[] = [];
}
