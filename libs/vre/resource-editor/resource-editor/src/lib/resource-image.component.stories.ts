import { provideRouter } from '@angular/router';
import {
  Constants,
  IHasPropertyWithPropertyDefinition,
  ReadResource,
  ReadStillImageFileValue,
  ReadTextValueAsString,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RegionService } from './representations/region.service';
import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceImageComponent } from './resource-image.component';

const makeTextPropDef = (id: string, label: string): ResourcePropertyDefinition => {
  const def = new ResourcePropertyDefinition();
  def.id = id;
  def.label = label;
  def.objectType = Constants.TextValue;
  def.subPropertyOf = [];
  def.isLinkProperty = false;
  def.isEditable = true;
  return def;
};

const makePropEntry = (propDef: ResourcePropertyDefinition, guiOrder: number): IHasPropertyWithPropertyDefinition => ({
  propertyIndex: propDef.id,
  cardinality: 1 as any,
  guiOrder,
  isInherited: false,
  propertyDefinition: propDef,
});

const makeTextValue = (id: string, text: string): ReadTextValueAsString => {
  const v = new ReadTextValueAsString();
  v.id = id;
  v.text = text;
  v.type = Constants.TextValue;
  v.userHasPermission = 'RV';
  return v;
};

const makeEntityInfo = (
  resourceType: string,
  propEntries: IHasPropertyWithPropertyDefinition[] = []
): ResourceClassAndPropertyDefinitions => {
  const classStub = {
    getResourcePropertiesList: () => propEntries,
    propertiesList: propEntries,
  } as unknown as ResourceClassDefinitionWithPropertyDefinition;
  return new ResourceClassAndPropertyDefinitions({ [resourceType]: classStub }, {});
};

const makeResource = (permission = 'CR'): DspResource => {
  const titlePropId = 'http://0.0.0.0:3333/ontology/0803/example/v2#hasTitle';
  const descriptionPropId = 'http://0.0.0.0:3333/ontology/0803/example/v2#hasDescription';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const descriptionDef = makeTextPropDef(descriptionPropId, 'Description');
  const propEntries = [makePropEntry(titleDef, 0), makePropEntry(descriptionDef, 1)];

  const fileValue = {
    type: Constants.StillImageFileValue,
    fileUrl: 'https://iiif.dasch.swiss/0803/0tZ4P3NQCnP-D7jmYEVBSRw.jpx/full/,200/0/default.jpg',
    filename: 'image.jpx',
    userHasPermission: 'RV',
    copyrightHolder: null,
    authorship: [],
    license: null,
    iiifBaseUrl: 'https://iiif.dasch.swiss/0803/0tZ4P3NQCnP-D7jmYEVBSRw.jpx',
  } as unknown as ReadStillImageFileValue;

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageRepresentation';
  res.label = 'My Storybook Image';
  res.attachedToProject = 'http://rdfh.ch/projects/0803';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasStillImageFileValue]: [fileValue],
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Image')],
    [descriptionPropId]: [makeTextValue('http://rdfh.ch/value/desc-1', 'A sample image resource for Storybook previews.')],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries);
  return generateDspResource(res);
};

const meta: Meta<ResourceImageComponent> = {
  title: 'Resource Editor / Resource / Still Image',
  component: ResourceImageComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        {
          provide: AppConfigService,
          useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
        },
        {
          provide: ProjectApiService,
          useValue: { get: () => of({ project: { id: '', shortcode: '0803', shortname: 'example', longname: 'My Storybook Project' } }) },
        },
        {
          provide: RegionService,
          useValue: {
            regions$: of([]),
            regionsLoading$: of(false),
            selectedRegion$: of(null),
            showRegions: () => {},
            initialize: () => {},
            selectRegion: () => {},
            filterToRegion: () => {},
            updateRegions$: () => of([]),
          },
        },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false), projectShortcode$: of('0803') } },
        {
          provide: RepresentationService,
          useValue: { getFileInfo: () => of({ originalFilename: 'image.jpx' }), downloadProjectFile: () => {} },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
        {
          provide: AdminAPIApiService,
          useValue: { getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: [] }) },
        },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: { doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }) },
            },
          },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The image resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
    annotationIri: {
      description: 'Optional IRI of an annotation to highlight on load.',
      table: { type: { summary: 'string | null' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceImageComponent>;

export const DefaultView: Story = {
  name: 'Shows image resource with header, legal info, viewer and image tabs',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Resource representation is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-representation')).not.toBeNull();
    });
  },
};

export const RestrictedView: Story = {
  name: 'Shows restriction banner when user has only restricted view permission',
  args: { resource: makeResource('RV') },
  play: async ({ canvasElement, step }) => {
    await step('Restriction banner is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-restriction')).not.toBeNull();
    });
  },
};
