import { provideRouter } from '@angular/router';
import { Constants, ReadResource, ReadResourceSequence, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RegionService } from '../../representation/region.service';
import { RepresentationService } from '../../representation/representation.service';
import { ResourceFetcherService } from '../../representation/resource-fetcher.service';
import { ResourceCompoundComponent } from './resource-compound.component';
import {
  DEFAULT_HAS_PERMISSIONS,
  dspApiConnectionStub,
  makeEntityInfo,
  makePropEntry,
  makeTextPropDef,
  makeTextValue,
  resourceFetcherServiceStub,
} from '../../resource-stories.helper';

const IIIF_BASE = 'https://iiif.wellcomecollection.org/image';

const PAGES: { filename: string; dimX: number; dimY: number }[] = [
  { filename: 'b20432033_B0008608.JP2', dimX: 3543, dimY: 2480 },
  { filename: 'b18035723_0001.JP2', dimX: 2569, dimY: 3543 },
  { filename: 'b18035723_0002.JP2', dimX: 2231, dimY: 3040 },
  { filename: 'b18035723_0003.JP2', dimX: 2411, dimY: 3372 },
  { filename: 'b18035723_0004.JP2', dimX: 2411, dimY: 3372 },
];

const makeStillImageFileValue = (page: number): ReadStillImageFileValue => {
  const { filename, dimX, dimY } = PAGES[page];
  return {
    type: Constants.StillImageFileValue,
    fileUrl: `${IIIF_BASE}/${filename}/full/200,/0/default.jpg`,
    filename,
    userHasPermission: 'RV',
    copyrightHolder: null,
    authorship: [],
    license: null,
    iiifBaseUrl: IIIF_BASE,
    dimX,
    dimY,
  } as unknown as ReadStillImageFileValue;
};

const makeIncomingImageResource = (index: number): ReadResource => {
  const titlePropId = 'http://0.0.0.0:3333/ontology/0803/example/v2#hasTitle';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const propEntries = [makePropEntry(titleDef, 0)];

  const res = new ReadResource();
  res.id = `http://rdfh.ch/resource/incoming-${index + 1}`;
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageRepresentation';
  res.label = `Compound Page ${index + 1}`;
  res.attachedToProject = 'http://rdfh.ch/projects/0803';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = 'CR';
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasStillImageFileValue]: [makeStillImageFileValue(index)],
    [titlePropId]: [makeTextValue(`http://rdfh.ch/value/title-${index + 1}`, `Compound Page ${index + 1}`)],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'Still Image Representation');
  return res;
};

const incomingResources = PAGES.map((_, i) => makeIncomingImageResource(i));
const incomingResourceMap = Object.fromEntries(incomingResources.map(r => [r.id, r]));

const makeResource = (permission = 'CR'): DspResource => {
  const titlePropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasTitle';
  const descriptionPropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasDescription';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const descriptionDef = makeTextPropDef(descriptionPropId, 'Description');
  const propEntries = [makePropEntry(titleDef, 0), makePropEntry(descriptionDef, 1)];

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageRepresentation';
  res.label = 'My Storybook Compound';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Compound', permission)],
    [descriptionPropId]: [
      makeTextValue('http://rdfh.ch/value/desc-1', 'A sample compound resource for Storybook previews.', permission),
    ],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'Still Image Representation');
  return generateDspResource(res);
};

const incomingSequence = { resources: incomingResources, mayHaveMoreResults: false } as unknown as ReadResourceSequence;

const meta: Meta<ResourceCompoundComponent> = {
  title: 'Resource Editor / Resource / Compound',
  component: ResourceCompoundComponent,
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
          useValue: {
            get: () =>
              of({ project: { id: '', shortcode: '0803', shortname: 'example', longname: 'My Storybook Project' } }),
          },
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
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub('0803') },
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
              res: { getResource: (iri: string) => of(incomingResourceMap[iri] ?? incomingResources[0]) },
              search: {
                ...dspApiConnectionStub.v2.search,
                doSearchStillImageRepresentations: () => of(incomingSequence),
                doSearchIncomingRegions: () => of({ resources: [], mayHaveMoreResults: false }),
              },
            },
          },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The compound resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
    compoundCount: {
      description: 'Total number of sub-resources in the compound.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceCompoundComponent>;

export const Editable: Story = {
  name: 'Shows compound resource with header, viewer and compound tabs when user can edit (CR permission)',
  args: { resource: makeResource(), compoundCount: 5 },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Tab group is rendered', async () => {
      await expect(canvasElement.querySelector('mat-tab-group')).not.toBeNull();
    });
  },
};

export const ReadOnly: Story = {
  name: 'Shows restriction banner when user has read-only permission (RV)',
  args: { resource: makeResource('RV'), compoundCount: 3 },
  play: async ({ canvasElement, step }) => {
    await step('Restriction banner is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-restriction')).not.toBeNull();
    });
  },
};
