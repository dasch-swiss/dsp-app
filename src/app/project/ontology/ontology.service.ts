import { Injectable } from '@angular/core';
import {
    Cardinality,
    Constants, ReadOntology,
    ResourcePropertyDefinitionWithAllLanguages
} from '@dasch-swiss/dsp-js';
import { Observable, of } from 'rxjs';
import { CacheService } from 'src/app/main/cache/cache.service';
import {
    DefaultProperties,
    DefaultProperty,
    PropertyCategory
} from './default-data/default-properties';

/**
 * helper methods for the ontology editor
 */
@Injectable({
    providedIn: 'root'
})
export class OntologyService {

    // list of default property types
    defaultProperties: PropertyCategory[] = DefaultProperties.data;

    constructor(
        private _cache: CacheService
    ) { }

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

    getSuperProperty(property: ResourcePropertyDefinitionWithAllLanguages): string {
        // get ontology from property info
        const ontoIri = property.id.split(Constants.HashDelimiter)[0];

        let superPropIri: string;

        // get iri from sub properties
        if (property.subPropertyOf.length) {
            for (const subProp of property.subPropertyOf) {
                const baseOntoIri = subProp.split(Constants.HashDelimiter)[0];
                // compare with knora base ontology
                if (baseOntoIri !== Constants.KnoraApiV2) {
                    // the property is not a subproperty of knora base ontology
                    // get property iri from another ontology
                    this._cache.get('currentProjectOntologies').subscribe(
                        (ontologies: ReadOntology[]) => {
                            const onto = ontologies.find(i => i.id === baseOntoIri);
                            superPropIri = onto.properties[subProp].subPropertyOf[0];
                        }
                    );
                }

                if (superPropIri) {
                    break;
                }
            }
        }

        return (superPropIri ? superPropIri : undefined);
    }

    /**
     * get default property information for a certain ontology property
     */
    getDefaultPropType(property: ResourcePropertyDefinitionWithAllLanguages): Observable<DefaultProperty> {
        let propType: DefaultProperty;

        if (!property.guiElement) {
            // we don't know what element to use, so it's unsupported property
            return of (DefaultProperties.unsupported);
        }

        for (const group of this.defaultProperties) {
            if (property.subPropertyOf.length) {
                for (const subProp of property.subPropertyOf) {
                    // if subProp is of type "link to" or "part of" we have to check the subproperty;
                    // otherwise we get the necessary property info from the objectType
                    if (subProp === Constants.HasLinkTo || subProp === Constants.IsPartOf) {
                        propType = (group.elements.find(i =>
                            i.guiEle === property.guiElement && i.subPropOf === subProp
                        ));
                    } else {

                        // if the property is type of number or list, the gui element is not relevant
                        // because the app supports only one gui element (at the moment): the spinbox resp. the list pulldown
                        if (property.objectType === Constants.DecimalValue || property.objectType === Constants.ListValue) {
                            propType = (group.elements.find(i =>
                                i.objectType === property.objectType
                            ));
                        } else if (property.objectType === Constants.IntValue && subProp === Constants.SeqNum) {
                            propType = (group.elements.find(i =>
                                i.objectType === property.objectType && i.subPropOf === Constants.SeqNum
                            ));
                        } else {
                            propType = (group.elements.find(i =>
                                i.guiEle === property.guiElement && i.objectType === property.objectType
                            ));
                        }
                    }
                    if (propType) {
                        break;
                    }
                }
                if (propType) {
                    break;
                }
            }
        }

        if (!propType) {
            // property type could not be found in the list of default properties
            // maybe it's not supported e.g. if propDef.objectType === Constants.GeomValue || propDef.subPropertyOf[0] === Constants.HasRepresentation
            return of (DefaultProperties.unsupported);
        }

        // return of(propType);
        return of (propType);

    }
}
