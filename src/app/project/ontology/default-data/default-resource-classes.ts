import { Constants } from '@dasch-swiss/dsp-js';

export interface DefaultClass {
    iri: string;
    label: string;
    icons?: string[];
}

export class DefaultResourceClasses {

    public static data: DefaultClass[] = [
        {
            iri: Constants.Resource,
            label: 'Object without file representation (metadata only)'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'StillImageRepresentation',
            label: 'Still Image'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'MovingImageRepresentation',
            label: 'Moving Image'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'AudioRepresentation',
            label: 'Audio'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'TextRepresentation',
            label: 'Text'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'DocumentRepresentation',
            label: 'Document (Word, PDF, etc.)'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.HashDelimiter + 'DDDRepresentation',
            label: 'RTI Image'
        }
    ];

}
