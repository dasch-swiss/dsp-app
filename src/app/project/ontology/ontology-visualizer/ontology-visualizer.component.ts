import { Component, Inject, Input, OnInit } from '@angular/core';
import { ClassDefinition, KnoraApiConnection, ReadOntology } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { Link, Node } from 'node_modules/d3-force-3d';
import { ResourceClassFormService } from '../resource-class-form/resource-class-form.service';

export interface NewOntology {
    projectIri: string;
    name: string;
    label: string;
}

@Component({
    selector: 'app-ontology-visualizer',
    templateUrl: './ontology-visualizer.component.html',
    styleUrls: ['./ontology-visualizer.component.scss']
})
export class OntologyVisualizerComponent implements OnInit {
    // ontology JSON-LD object
    @Input() ontology: ReadOntology;
    @Input() ontoClasses: ClassDefinition[];
    loading: boolean;
    nodes: Node[] = [];
    links: Link[] = [];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _resourceClassFormService: ResourceClassFormService) { }

    isInNodes(item: string) {
        for (const node of this.nodes) {
            if (node['id'] === item) {
                return true;
            }
        }
        return false;
    }
    createLabelFromIRI(iri: string) {
        const resourceInfo = iri.split('#', 2);
        let ontoName: string;
        let type: string;
        let newLabel: string;
        if (resourceInfo[1] !== undefined) {
            type = resourceInfo[1];
            ontoName = this._resourceClassFormService.getOntologyName(resourceInfo[0]);
            newLabel = ontoName + ':' + type;
        } else {
            type = iri.split('/').pop();
            ontoName = iri.replace(type, '');
            newLabel = iri;
        }

        return {'ontoName': ontoName, 'type': type, 'newLabel': newLabel};
    }
    getSubclassLinksAndExternalResources(res: ClassDefinition): void {
        for (const item of res.subClassOf) {
            if (!this.isInNodes(item)) {
                const nodeInfo = this.createLabelFromIRI(item);
                this.nodes.push({'id': item, 'label': nodeInfo.newLabel, 'group': 'resource', 'class': 'external'});
            }
            const source = res.id;
            const target = item;
            let rotation = 0;
            let curvature = 0;
            if (source === target) {
                rotation = 1;
                curvature = 0.5;
            }
            const link = {'source': res.id, 'target': item, 'label': 'subClassOf', 'rotation': rotation, 'curvature': curvature};
            this.links.push(link);
        }
    }

    addResourceClassesToNodes() {
        for (const res of this.ontoClasses) {
            const resInfo =  this.createLabelFromIRI(res.id);
            const node = {'id': res.id, 'label': resInfo.newLabel, 'group': 'resource', 'class': 'native'}
            this.nodes.push(node);
        }
    }
    addObjectTypeToNodes(targetID: string, propID: string, resLabel: string): string {
        let newNode: Node;
        // object Value is a literal
        const nodeInfo = this.createLabelFromIRI(targetID);
        if (targetID.endsWith('Value')) {
            targetID = resLabel + '_' + propID.split('#', 2)[1];
            newNode = {'id': targetID, 'label': nodeInfo.newLabel, 'group': 'literal', 'class': nodeInfo.type};
        // object Value is a resource defined in another ontology
        } else {
            newNode = {'id': targetID, 'label': nodeInfo.newLabel, 'group': 'resource', 'class': 'external'};
        }
        if (!this.isInNodes(targetID)) {
            this.nodes.push(newNode);
        }
        return targetID;
    }
    convertOntolologytoGraph() {
        this.addResourceClassesToNodes();
        for (const res of this.ontoClasses) {
            const source = res.id;
            this.getSubclassLinksAndExternalResources(res);
            for (const prop of res.propertiesList) {
                if (prop.guiOrder >= 0 && this.ontology.properties[prop.propertyIndex]
                    && this.ontology.properties[prop.propertyIndex].objectType !== 'http://api.knora.org/ontology/knora-api/v2#LinkValue') {
                    const targetObject = this.ontology.properties[prop.propertyIndex].objectType;
                    const proplabel = this.ontology.properties[prop.propertyIndex].label;
                    const target = this.addObjectTypeToNodes(targetObject, prop.propertyIndex, res.label);
                    let rotation = 0;
                    let curvature = 0;
                    if (source === target) {
                        rotation = 1;
                        curvature = 0.5;
                    }
                    const link = {'source': source, 'target': target, 'label': proplabel, 'rotation': rotation, 'curvature': curvature};
                    this.links.push(link);

                }
            }
        }
        return { 'nodes': this.nodes, 'links': this.links};
    }
    ngOnInit() {
        const gData = this.convertOntolologytoGraph();
        const gData_json = JSON.stringify(gData, null, 4);
        console.log(gData_json);
    }

}
