import { Constants } from '@dasch-swiss/dsp-js';
import { DefaultClass } from './default-properties';

export class DefaultResourceClasses {
  public static data: DefaultClass[] = [
    {
      iri: Constants.Resource,
      label: 'Object without representation',
      icon: 'person_outline',
    },
    {
      iri: Constants.StillImageRepresentation,
      label: 'Still Image',
      icon: 'photo',
    },
    {
      iri: Constants.MovingImageRepresentation,
      label: 'Moving Image',
      icon: 'movie',
    },
    {
      iri: Constants.AudioRepresentation,
      label: 'Audio',
      icon: 'audiotrack',
    },
    {
      iri: Constants.TextRepresentation,
      label: 'Text',
      icon: 'rtt',
    },
    {
      iri: Constants.DocumentRepresentation,
      label: 'Document',
      icon: 'description',
    },
    {
      iri: Constants.ArchiveRepresentation,
      label: 'Archive',
      icon: 'archive',
    },
  ] as const;

  public static getLabel(iri: string): string | undefined {
    const label = this.data.find(rc => rc.iri === iri)?.label;
    return label || iri.split(/[#/]/).pop();
  }

  public static getIcon(iri: string): string | undefined {
    return this.data.find(rc => rc.iri === iri)?.icon || undefined;
  }
}
