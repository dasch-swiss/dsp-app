import { ReadOntology } from "@dasch-swiss/dsp-js";
import { IProjectOntologiesKeyValuePairs, OntologyProperties } from "../model-interfaces";

export class OntologiesStateModel {
    isLoading: boolean | undefined;
    hasLoadingErrors: boolean | undefined;
    projectOntologies: IProjectOntologiesKeyValuePairs = {};
    currentOntology: ReadOntology | null = null;
    currentOntologyCanBeDeleted = false;
    currentProjectOntologyProperties: OntologyProperties[] = [];
}
