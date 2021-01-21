/* Interface for url type */
export interface UrlProperty {
    type: string;
    value: string;
}

/* Interface to add address metadata */
export interface IAddress {
    type: string;
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
}

/* Interface to add organisation metadata */
export interface IOrganisation {
    type: string;
    id: string;
    name: string;
    address?: IAddress;
    email?: string;
    url?: string;
}

/* Interface to add person metadata */
export interface IPerson {
    type: string;
    id: string;
    jobTitle: string | string[];
    givenName: string;
    familyName: string;
    organisation?: IOrganisation;
    memberOf: string;
    email?: string | string[];
    sameAs?: UrlProperty;
    address?: IAddress | IAddress[];
}

/* Interface for Attribution array available for every dataset */
export interface IAttribution {
    type: string;
    role: string;
    agent: IPerson | IOrganisation;
}

/* Interface to add DMP metadata */
export interface IDMP {
    type: string;
    id: string;
    isAvailable: boolean;
    url?: UrlProperty;
}

/* Interface to add SpatialCoverage: place metadata */
export interface IPlace {
    name: string;
    url: string;
}

/* Interface to add SpatialCoverage metadata */
export interface ISpatialCoverage {
    place: IPlace;
}

/* Interface for funder metadata */
export interface IFunder {
    id: string;
}

/* Interface to add grant metadata */
export interface IGrant {
    type: string;
    id: string;
    funder: IFunder;
    number?: string;
    name?: string;
    url?: UrlProperty;
}

/* Interface to add project metadata */
export interface IProject {
    type: string;
    id: string;
    url: UrlProperty;
    shortcode: string;
    name: string;
    description: string;
    keywords: string[];
    discipline: IPlace;
    startDate: string;
    temporalCoverage: IPlace;
    spatialCoverage: ISpatialCoverage[];
    funder: IFunder;
    dataManagementPlan?: IDMP;
    publication?: string | string[];
    endDate?: string;
    grant?: IGrant;
    contactPoint?: IPerson | IOrganisation;
    alternateName?: string | string[];
}

/* Interface to add dataset metadata */
export interface IDataset {
    type: string;
    id: string;
    abstract: string | string[];
    conditionsOfAccess: string;
    howToCite: string;
    language: string[];
    license: UrlProperty;
    qualifiedAttribution: IAttribution[];
    status: 'in planning' | 'ongoing' | 'on hold' | 'finished';
    title: string;
    typeOfData: string[];
    project: IProject;
    sameAs?: UrlProperty;
    alternativeTitle?: string;
    documentation?: string | string[];
    datePublished?: string;
    dateCreated?: string;
    dateModified?: string;
    distribution?: UrlProperty;
}
