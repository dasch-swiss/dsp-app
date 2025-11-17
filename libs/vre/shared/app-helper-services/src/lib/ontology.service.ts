import { Inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Constants, KnoraApiConfig, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import {
  LanguageTaggedStringLiteralV2,
  PlainStringLiteralV2,
  StringLiteralV2,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
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
    @Inject(DspApiConfigToken) private readonly _dspApiConfig: KnoraApiConfig,
    private readonly _route: ActivatedRoute,
    private readonly _localizationService: LocalizationService
  ) {}

  static getOntologyNameFromIri(ontologyIri: string): string {
    const array = ontologyIri.split('/');

    const pos = array.length - 2;

    return array[pos];
  }

  static getNameFromIri(iri: string): string {
    const array = iri.split(Constants.HashDelimiter);
    return array[1];
  }

  getInPreferedLanguage(labels: StringLiteralV2[]): string | undefined {
    const language = this._localizationService.getCurrentLanguage();
    if ((labels as { language?: string }[])[0]['language']) {
      return (labels as unknown as LanguageTaggedStringLiteralV2[]).find(l => l.language === language)?.value;
    } else {
      return (labels as unknown as PlainStringLiteralV2[])[0].value;
    }
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

  getOntologyIriFromRoute(projectShortcode: string, ontologyName: string) {
    const iriBase = this.getIriBaseUrl();
    return `${iriBase}/${RouteConstants.ontology}/${projectShortcode}/${ontologyName}/v2`;
  }

  getClassIdFromParams(projectShortcode: string, ontologyLabel: string, classLabel: string) {
    return `${this.getOntologyIriFromRoute(projectShortcode, ontologyLabel)}#${classLabel}`;
  }
}
