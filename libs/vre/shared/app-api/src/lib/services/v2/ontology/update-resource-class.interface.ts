import { StringLiteralV2 } from './string-literal.v2';

export interface UpdateResourceClass {
    '@id': string;
    '@type': string;
    'rdfs:labels': StringLiteralV2[];
}
