import { Injectable } from '@angular/core';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';

/**
 * helper methods for the ontology editor
 */
@Injectable({
    providedIn: 'root'
})
export class OntologyService {

    constructor() { }

    /**
     * create a unique name (id) for resource classes or properties;
     *
     * @param ontologyIri
     * @param [label]
     * @returns unique name
     */
    setUniqueName(ontologyIri: string, label?: string, type?: 'class' | 'prop'): string {

        if (label && type) {
            // build name from label
            // normalize and replace spaces and special chars
            return type + '-' + label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u00a0-\u024f]/g, '').replace(/[\])}[{(]/g, '').replace(/\s+/g, '-').replace(/\//g, '-').toLowerCase();
        } else {
            // build randomized name
            // the name starts with the three first character of ontology iri to avoid a start with a number followed by randomized string
            return this.getOntologyName(ontologyIri).substring(0, 3) + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
        }
    }

    /**
     * get the ontolgoy name from ontology iri
     *
     * @param  {string} ontologyIri
     * @returns string
     */
    getOntologyName(ontologyIri: string): string {

        const array = ontologyIri.split('/');

        const pos = array.length - 2;

        return array[pos].toLowerCase();
    }

    /**
     * get the name from the iri
     * @param iri
     * @returns name from iri
     */
    getNameFromIri(iri: string): string {
        const array = iri.split(Constants.HashDelimiter);

        return array[1];
    }

    /**
     * convert cardinality values (multiple? & required?) from form to DSP-JS cardinality enum 1-n, 0-n, 1, 0-1
     * @param  {boolean} multiple
     * @param  {boolean} required
     * @returns Cardinality
     */
    translateCardinality(multiple: boolean, required: boolean): Cardinality {

        if (multiple && required) {
            // cardinality 1-n (at least one)
            return Cardinality._1_n;
        } else if (multiple && !required) {
            // cardinality 0-n (may have many)
            return Cardinality._0_n;
        } else if (!multiple && required) {
            // cardinality 1 (required)
            return Cardinality._1;
        } else {
            // cardinality 0-1 (optional)
            return Cardinality._0_1;
        }
    }
}
