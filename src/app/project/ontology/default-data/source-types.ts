import { Constants } from '@dasch-swiss/dsp-js';

export interface DefaultSourceType {
    iri: string;
    name: string;
    label?: string;
    icons?: string[];
}

export class SourceTypes {

    public static data: DefaultSourceType[] = [
        {
            iri: Constants.Resource,
            name: 'knora-api:Resource',
            label: 'Object without file representation (metadata only)'
        },
        {
            iri: Constants.StillImageFileValue,
            name: 'knora-api:StillImageRepresentation',
            label: 'Still Image'
        },
        {
            iri: Constants.MovingImageFileValue,
            name: 'knora-api:MovingImageRepresentation',
            label: 'Moving Image'
        },
        {
            iri: Constants.AudioFileValue,
            name: 'knora-api:AudioRepresentation',
            label: 'Audio'
        },
        {
            iri: Constants.TextFileValue,
            name: 'knora-api:TextRepresentation',
            label: 'Text'
        },
        {
            iri: Constants.DocumentFileValue,
            name: 'knora-api:DocumentRepresentation',
            label: 'Document (Word, PDF, etc.)'
        },
        {
            iri: Constants.DDDFileValue,
            name: 'knora-api:DDDRepresentation',
            label: 'RTI Image'
        }
    ];

}
