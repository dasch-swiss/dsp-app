import { Constants } from '@knora/api';

export interface DefaultSourceType {
    iri: string;
    name: string;
    label?: string;
    icons?: string[];
}

export class SourceTypes {

    public static data: DefaultSourceType[] = [
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
            iri: Constants.DDDFileValue,
            name: 'knora-api:DDDRepresentation',
            label: 'RTI Image'
        },
        {
            iri: Constants.TextFileValue,
            name: 'knora-api:TextRepresentation',
            label: 'Text'
        },
        {
            iri: Constants.Resource,
            name: 'knora-api:Resource',
            label: 'Object without file representation (metadata only)'
        },
        {
            iri: Constants.DocumentFileValue,
            name: 'knora-api:DocumentRepresentation',
            label: 'Document (Word, PDF, etc.)'
        }
    ];

}
