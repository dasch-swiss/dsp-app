export interface CreateResourceClass {
    name: string;
    '@type': string;
    'rdfs:label': string;
    'comment'?: string;
    'rdfs:subClassOf': string[];
}
