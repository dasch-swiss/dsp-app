import { provideRouter } from '@angular/router';
import { Constants, ReadResource, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RegionService } from './representations/region.service';
import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceImageComponent } from './resource-image.component';

const makeResource = (permission = 'CR'): DspResource =>
  new DspResource({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageRepresentation',
    label: 'My Storybook Image',
    attachedToProject: 'http://rdfh.ch/projects/0803',
    attachedToUser: 'http://rdfh.ch/users/test',
    userHasPermission: permission,
    creationDate: '2024-03-15T10:30:00Z',
    properties: {
      [Constants.HasStillImageFileValue]: [
        {
          type: Constants.StillImageFileValue,
          id: 'http://rdfh.ch/value/image-1',
          fileUrl: 'https://iiif.dev.dasch.swiss/0803/1awyJYmiA5Z-FQ9xDcEh2Hi.jp2/full/1333,1815/0/default.jpg',
          iiifBaseUrl: 'https://iiif.dev.dasch.swiss/0803',
          filename: '1awyJYmiA5Z-FQ9xDcEh2Hi.jp2',
          dimX: 1333,
          dimY: 1815,
          userHasPermission: 'RV',
        } as unknown as ReadStillImageFileValue,
      ],
    },
    entityInfo: {
      getPropertyDefinitionsByType: () => [],
    },
  } as unknown as ReadResource);

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
            showRegions$: of(false),
            selectedRegion$: of(null),
            highlightedRegionClicked$: of(null),
            initialize: () => {},
            showRegions: () => {},
            selectRegion: () => {},
            setHighlightedRegionClicked: () => {},
            filterToRegion: () => {},
            updateRegions: () => {},
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
