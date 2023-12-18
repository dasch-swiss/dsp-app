import { StringLiteralV2 } from './string-literal.v2';

export interface CreateResourceProperty {
    'name': string;
    'knora-api:subjectType': string;
    'knora-api:objectType': string;
    'comment'?: string;
    'rdfs:subPropertyOf'?: string;
    'guiElement'?: string;
    'guiAttributes'?: string;
    'rdfs:label': StringLiteralV2[];
}
