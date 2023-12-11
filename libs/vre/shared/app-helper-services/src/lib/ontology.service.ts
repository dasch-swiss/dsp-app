import { Inject, Injectable } from '@angular/core';
import {
    Cardinality,
    Constants,
    KnoraApiConfig,
    ReadOntology,
    ResourcePropertyDefinitionWithAllLanguages
} from '@dasch-swiss/dsp-js';
import { Observable, of } from 'rxjs';
import { DspApiConfigToken } from '@dasch-swiss/vre/shared/app-config';
import { DefaultProperties, DefaultProperty, PropertyCategory } from './default-data/default-properties';

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
    @Inject(DspApiConfigToken) private _dspApiConfig: KnoraApiConfig
  ) {
  }

  /**
   * create a unique name (id) for resource classes or properties;
   *
   * @param ontologyIri
   * @param [label]
   * @returns unique name
   */
  setUniqueName(
    ontologyIri: string,
    label?: string,
    type?: 'class' | 'prop'
  ): string {
    if (label && type) {
      // build name from label
      // normalize and replace spaces and special chars
      return (
        type +
        '-' +
        label
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[\u00a0-\u024f]/g, '')
          .replace(/[\])}[{(]/g, '')
          .replace(/\s+/g, '-')
          .replace(/\//g, '-')
          .toLowerCase()
      );
    } else {
      // build randomized name
      // the name starts with the three first character of ontology iri to avoid a start with a number followed by randomized string
      return (
        OntologyService.getOntologyName(ontologyIri).substring(0, 3) +
        Math.random().toString(36).substring(2, 5) +
        Math.random().toString(36).substring(2, 5)
      );
    }
  }

  /**
   * get the ontolgoy name from ontology iri
   *
   * @param  {string} ontologyIri
   * @returns string
   */
  static getOntologyName(ontologyIri: string): string {
    const array = ontologyIri.split('/');

    const pos = array.length - 2;

    return array[pos];
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

  /**
   * getCardinalityGuiValues: get a cardinalities boolean equivalent values;
   * @param card The cardinality enum
   * @returns object with boolean values for 'multiple' and 'required'
   */
  getCardinalityGuiValues(card: Cardinality): {
    multiple: boolean;
    required: boolean;
  } {
    return {
      multiple: card === Cardinality._0_n || card === Cardinality._1_n,
      required: card === Cardinality._1 || card === Cardinality._1_n
    };
  }

  getSuperProperty(
    property: ResourcePropertyDefinitionWithAllLanguages,
    currentProjectOntologies: ReadOntology[]
  ): string | undefined {
    let superPropIri: string | undefined;

    // get iri from sub properties
    if (property.subPropertyOf.length) {
      for (const subProp of property.subPropertyOf) {
        const baseOntoIri = subProp.split(Constants.HashDelimiter)[0];
        // compare with knora base ontology
        if (baseOntoIri !== Constants.KnoraApiV2) {
          // the property is not a subproperty of knora base ontology
          // get property iri from another ontology
          const onto = currentProjectOntologies.find((i) => i?.id === baseOntoIri);
          superPropIri = onto?.properties[subProp].subPropertyOf[0];
        }

        if (superPropIri) {
          break;
        }
      }
    }

    return superPropIri ? superPropIri : undefined;
  }

  /**
   * get default property information for a certain ontology property
   */
  getDefaultPropertyType(property: ResourcePropertyDefinitionWithAllLanguages): DefaultProperty {
    let propType: DefaultProperty | undefined;

    for (const group of this.defaultProperties) {
      if (property.subPropertyOf.length) {
        for (const subProp of property.subPropertyOf) {
          // if subProp is of type "link to" or "part of" we have to check the subproperty;
          // otherwise we get the necessary property info from the objectType
          if (
            subProp === Constants.HasLinkTo ||
            subProp === Constants.IsPartOf
          ) {
            propType = group.elements.find((i: DefaultProperty) =>
              i.guiEle === property.guiElement &&
              i.subPropOf === subProp
            );
          } else {
            if (
              property.objectType === Constants.IntValue &&
              subProp === Constants.SeqNum
            ) {
              // if the property is of type number, but sub property of SeqNum,
              // select the correct default prop params
              propType = group.elements.find((i: DefaultProperty) =>
                i.objectType === property.objectType &&
                i.subPropOf === Constants.SeqNum
              );
            } else if (
              property.objectType === Constants.TextValue
            ) {
              // if the property is of type text value, we have to check the gui element
              // to get the correct default prop params
              propType = group.elements.find((i: DefaultProperty) =>
                i.guiEle === property.guiElement &&
                i.objectType === property.objectType
              );
            } else {
              // in all other cases the gui-element resp. the subProp is not relevant
              // because the object type is unique
              propType = group.elements.find((i: DefaultProperty) => i.objectType === property.objectType
              );
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
      // maybe it's not supported or it's a subproperty of another prop.
      // e.g. if propDef.objectType === Constants.GeomValue || propDef.subPropertyOf[0] === Constants.HasRepresentation
      // --> TODO: check if it's a subproperty of another one in this ontology
      return DefaultProperties.unsupported;
    }

    // return of(propType);
    return propType;
  }

  getDefaultPropType = (property: ResourcePropertyDefinitionWithAllLanguages): Observable<DefaultProperty> =>
    of(this.getDefaultPropertyType(property));

  /**
   * get the IRI base url without configured api protocol.
   * The protocol in this case is always http
   * TODO: move to DSP-JS-Lib similar to `get ApiUrl`
   */
  getIriBaseUrl(): string {
    return (
      'http://' +
      this._dspApiConfig.apiHost +
      (this._dspApiConfig.apiPort !== null
        ? ':' + this._dspApiConfig.apiPort
        : '') +
      this._dspApiConfig.apiPath
    );
  }
}
