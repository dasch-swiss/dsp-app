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
            iri: Constants.KnoraApiV2 + Constants.Delimiter + "StillImageRepresentation",
            label: 'Still Image'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.Delimiter + "MovingImageRepresentation",
            label: 'Moving Image'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.Delimiter + "AudioRepresentation",
            label: 'Audio'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.Delimiter + "TextRepresentation",
            label: 'Text'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.Delimiter + "DocumentRepresentation",
            label: 'Document (Word, PDF, etc.)'
        },
        {
            iri: Constants.KnoraApiV2 + Constants.Delimiter + "DDDRepresentation",
            label: 'RTI Image'
        }
    ];

}
