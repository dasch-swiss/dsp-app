import { StringLiteralV2 } from './string-literal.v2';

export interface UpdateResourceProperty {
    '@id': string;
    '@type': string;
    'rdfs:labels': StringLiteralV2[];
}
