import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { Graph } from '../../../interfaces/graph.interface';
import { BaseApi } from '../../base-api';
import { CanDoResponse } from './can-do-response.interface';
import { CreateOntology } from './create-ontology.interface';
import { CreateResourceClassPayload } from './create-resource-class-payload.interface';
import { CreateResourceProperty } from './create-resource-property.interface';
import { Cardinality, IHasProperty } from './i-has-property.interface';
import { OntologyMetadata } from './ontology-metadata.interface';
import { ReadOntology } from './read-ontology.interface';
import { ResourceClassDefinitionWithAllLanguages } from './resource-class-definition-with-all-languages.interface';
import { ResourcePropertyDefinitionWithAllLanguages } from './resource-property-definition-with-all-languages.interface';
import { UpdateResourceClass } from './update-resource-class.interface';
import { UpdateResourcePropertyGuiElement } from './update-resource-property-gui-element.interface';
import { UpdateResourcePropertyResponse } from './update-resource-property-response.interface';
import { UpdateResourceProperty } from './update-resource-property.interface';

@Injectable({
  providedIn: 'root',
})
export class OntologyV2ApiService extends BaseApi {
  constructor(
    private _http: HttpClient,
    private _appConfig: AppConfigService
  ) {
    super('v2/ontologies', _appConfig.dspApiConfig);
  }

  getMetadata() {
    return this._http.get<Graph<OntologyMetadata>>(`${this.baseUri}/metadata`);
  }

  get(ontologyIri: string, allLanguages = false) {
    return this._http.get<ReadOntology>(
      `${this.baseUri}/allentities/${encodeURIComponent(ontologyIri)}${allLanguages ? '?allLanguages=true' : ''}`
    );
  }

  getByProject(iri: string) {
    return this._http.get<Graph<OntologyMetadata>>(`${this.baseUri}/metadata/${encodeURIComponent(iri)}`);
  }

  create(ontology: CreateOntology) {
    return this._http.post<OntologyMetadata>(this.baseUri, ontology);
  }

  canDelete(iri: string) {
    return this._http.get<CanDoResponse>(`${this.baseUri}/candeleteontology/${encodeURIComponent(iri)}`);
  }

  delete(iri: string, lastModificationDate: string) {
    return this._http.get(`${this.baseUri}/${encodeURIComponent(iri)}?lastModificationDate=${lastModificationDate}`);
  }

  update() {
    // TODO weird
  }

  deleteComment(iri: string, lastModificationDate: string) {
    return this._http.delete(
      `${this.baseUri}/comment/${encodeURIComponent(iri)}?lastModificationDate=${lastModificationDate}`
    );
  }

  createResourceClass(resourceClass: CreateResourceClassPayload) {
    return this._http.post<ResourceClassDefinitionWithAllLanguages>(`${this.baseUri}/classes`, resourceClass);
  }

  updateResourceClass(resourceClass: UpdateResourceClass) {
    return this._http.put<ResourceClassDefinitionWithAllLanguages>(`${this.baseUri}/classes`, resourceClass);
  }

  updateResourceProperty(updateProperty: UpdateResourceProperty) {
    return this._http.put<UpdateResourcePropertyResponse>(`${this.baseUri}/properties`, updateProperty);
  }

  canDeleteResourceClass(iri: string) {
    return this._http.get<CanDoResponse>(`${this.baseUri}/candeleteclass/${iri}`);
  }

  deleteResourceClass(iri: string, lastModificationDate: string) {
    return this._http.delete(
      `${this.baseUri}/classes/${encodeURIComponent(iri)}?lastModificationDate=${lastModificationDate}`
    );
  }

  deleteResourceClassComment(iri: string, lastModificationDate: string) {
    return this._http.delete<ResourceClassDefinitionWithAllLanguages>(
      `${this.baseUri}/classes/comment/${encodeURIComponent(iri)}?lastModificationDate=${lastModificationDate}`
    );
  }

  createResourceProperty(resource: CreateResourceProperty) {
    return this._http.post<ResourcePropertyDefinitionWithAllLanguages>(`${this.baseUri}/properties`, resource);
  }

  replaceGuiElementOfProperty(payload: UpdateResourcePropertyGuiElement) {
    return this._http.put<ResourcePropertyDefinitionWithAllLanguages>(`${this.baseUri}/properties/guielement`, payload);
  }

  canDeleteResourceProperty(iri: string) {
    return this._http.get<CanDoResponse>(`${this.baseUri}/candeleteproperty/${encodeURIComponent(iri)}`);
  }

  deleteResourceProperty(iri: string, lastModificationDate: string) {
    return this._http.delete(
      `${this.baseUri}/properties/${encodeURIComponent(iri)}?lastModificationDate=${lastModificationDate}`
    );
  }

  deleteResourcePropertyComment(iri: string, lastModificationDate: string) {
    return this._http.delete(
      `${this.baseUri}/properties/comment/${encodeURIComponent(iri)}?lastModificationDate=${lastModificationDate}`
    );
  }

  addCardinalityToResourceClass(payload: any) {
    return this._http.post(`${this.baseUri}/cardinalities`, payload);
  }

  canReplaceCardinalityOfResourceClass(iri: string) {
    return this._http.get(`${this.baseUri}/canreplacecardinalities/${encodeURIComponent(iri)}`);
  }

  canReplaceCardinalityOfResourceClassWith(resourceClassIri: string, propertyIri: string, newCardinality: string) {
    return this._http.get(
      `${this.baseUri}/canreplacecardinalities/${encodeURIComponent(resourceClassIri)}?propertyIri=${encodeURIComponent(
        propertyIri
      )}&newCardinality=${newCardinality}`
    );
  }

  replaceCardinalityOfResourceClass(cardinalities: Graph<{ cardinalities: IHasProperty[] }>) {
    return this._http.put<ResourceClassDefinitionWithAllLanguages>(`${this.baseUri}/cardinalities`, cardinalities);
  }

  canDeleteCardinalityFromResourceClass(cardinalities: Graph<{ cardinalities: Cardinality[] }>) {
    return this._http.post<CanDoResponse>(`${this.baseUri}/candeletecardinalities`, cardinalities);
  }

  deleteCardinalityFromResourceClass(payload: Graph<{ cardinalities: Cardinality[] }>) {
    return this._http.patch(`${this.baseUri}/cardinalities`, payload);
  }

  replaceGuiOrderOfCardinalities(payload) {
    return this._http.put<ResourcePropertyDefinitionWithAllLanguages>(`${this.baseUri}/guiorder`, payload);
  }

  private _updateMetadata(ontologyMetadata: OntologyMetadata) {
    return this._http.put<OntologyMetadata>(`${this.baseUri} / metadata`, ontologyMetadata);
  }

  private _update(iri: string, ontologyMetaData: OntologyMetadata) {
    return this._http.put<OntologyMetadata>(`${this.baseUri} /${encodeURIComponent(iri)}`, ontologyMetaData);
  }
}
