import { Inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Constants, KnoraApiConfig, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConfigToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { DefaultProperties, DefaultProperty, PropertyCategory } from './default-data/default-properties';
import { LocalizationService } from './localization.service';

/**
 * helper methods for the ontology editor
 */
@Injectable({
  providedIn: 'root',
})
export class OntologyService {
  // list of default property types
  defaultProperties: PropertyCategory[] = DefaultProperties.data;

  constructor(
    @Inject(DspApiConfigToken) private _dspApiConfig: KnoraApiConfig,
    private _route: ActivatedRoute,
    private _localizationService: LocalizationService
  ) {}

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

  getInPreferedLanguage(labels: StringLiteralV2[]): string | undefined {
    const language = this._localizationService.getCurrentLanguage();
    return labels.find(l => l.language === language)?.value;
  }

  /**
   * get default property information for a certain ontology property
   */
  getDefaultProperty(property: ResourcePropertyDefinitionWithAllLanguages): DefaultProperty {
    let propType: DefaultProperty | undefined;
    for (const defaultProperty of this.defaultProperties) {
      // TODO: WHUT IS THIS?
      if (property?.subPropertyOf.length) {
        for (const superProp of property.subPropertyOf) {
          // if subProp is of type "link to" or "part of" we have to check the subproperty;
          // otherwise we get the necessary property info from the objectType
          if (superProp === Constants.HasLinkTo || superProp === Constants.IsPartOf) {
            propType = defaultProperty.elements.find(
              (i: DefaultProperty) => i.guiElement === property.guiElement && i.subPropOf === superProp
            );
          } else if (property.objectType === Constants.IntValue && superProp === Constants.SeqNum) {
            // if the property is of type number, but sub property of SeqNum,
            // select the correct default prop params
            propType = defaultProperty.elements.find(
              (i: DefaultProperty) => i.objectType === property.objectType && i.subPropOf === Constants.SeqNum
            );
          } else if (property.objectType === Constants.TextValue) {
            // if the property is of type text value, we have to check the gui element
            // to get the correct default prop params
            propType = defaultProperty.elements.find(
              (i: DefaultProperty) => i.guiElement === property.guiElement && i.objectType === property.objectType
            );
          } else if (superProp === Constants.HasRepresentation) {
            propType = defaultProperty.elements.find((i: DefaultProperty) => i.subPropOf === Constants.HasLinkTo);
          } else {
            // in all other cases the gui-element resp. the subProp is not relevant
            // because the object type is unique
            propType = defaultProperty.elements.find((i: DefaultProperty) => i.objectType === property.objectType);
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

  /**
   * get the IRI base url without configured api protocol.
   * The protocol in this case is always http
   * TODO: move to DSP-JS-Lib similar to `get ApiUrl`
   */
  getIriBaseUrl(): string {
    return `http://${this._dspApiConfig.apiHost}${
      this._dspApiConfig.apiPort !== null ? `:${this._dspApiConfig.apiPort}` : ''
    }${this._dspApiConfig.apiPath}`;
  }

  getOntologyIriFromRoute(projectShortcode: string): string | null {
    const iriBase = this.getIriBaseUrl();
    let ontologyName = this._route.snapshot?.paramMap.get(RouteConstants.ontoParameter);
    if (!ontologyName && this._route.snapshot?.root.children[0].children.length) {
      ontologyName = this._route.snapshot?.root.children[0].children[0].paramMap.get(RouteConstants.ontoParameter);
    }

    return ontologyName ? `${iriBase}/${RouteConstants.ontology}/${projectShortcode}/${ontologyName}/v2` : null;
  }
}
