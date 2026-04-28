import { Constants, ReadResource, ReadStillImageExternalFileValue, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect } from 'storybook/test';
import { CompoundService } from '../../compound/compound.service';
import { RegionService } from '../region.service';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { OsdDrawerService } from './osd-drawer.service';
import { StillImageComponent } from './still-image.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeInternalResource = (): ReadResource =>
  ({
    id: 'http://rdfh.ch/resource/image-1',
    attachedToProject: 'http://rdfh.ch/project/1',
    attachedToUser: 'http://rdfh.ch/user/1',
    userHasPermission: 'RV',
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
  }) as unknown as ReadResource;

const makeExternalResource = (): ReadResource =>
  ({
    id: 'http://rdfh.ch/resource/image-external',
    attachedToProject: 'http://rdfh.ch/project/1',
    attachedToUser: 'http://rdfh.ch/user/1',
    userHasPermission: 'RV',
    properties: {
      [Constants.HasStillImageFileValue]: [
        {
          type: Constants.StillImageExternalFileValue,
          id: 'http://rdfh.ch/value/image-external',
          externalUrl: 'https://iiif.io/api/image/3.0/example/reference/59d09991-54f1-46e1-86e4-f0a35722b657',
          userHasPermission: 'RV',
        } as unknown as ReadStillImageExternalFileValue,
      ],
    },
  }) as unknown as ReadResource;

const makeEmptyResource = (): ReadResource =>
  ({
    id: 'http://rdfh.ch/resource/image-empty',
    attachedToProject: 'http://rdfh.ch/project/1',
    attachedToUser: 'http://rdfh.ch/user/1',
    userHasPermission: 'RV',
    properties: {},
  }) as unknown as ReadResource;

// OpenSeadragon needs a real DOM element but we don't want it to load tiles.
// Stub the service so it noops on init and exposes a minimal viewer shape.
const osdServiceStub = {
  viewer: {
    open: () => {},
    destroy: () => {},
    loadTilesWithAjax: false,
    addHandler: () => {},
    removeHandler: () => {},
  },
  onInit: () => {},
  drawing: false,
  toggleDrawing: () => {},
  zoom: () => {},
  createdRectangle$: of(),
};

const osdDrawerServiceStub = {
  onInit: () => {},
  update: () => {},
};

// ---------------------------------------------------------------------------
// Shared providers
// ---------------------------------------------------------------------------

const sharedProviders = [
  {
    provide: AppConfigService,
    useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
  },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        res: { getResource: () => NEVER },
        search: {
          doSearchIncomingLinks: () => NEVER,
          doExtendedSearch: () => NEVER,
          doSearchIncomingRegions: () => NEVER,
        },
      },
    },
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
  { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false), projectShortcode$: of('0001') } },
  {
    provide: RepresentationService,
    useValue: {
      downloadProjectFile: () => {},
      getFileInfo: () => of({ originalFilename: 'image.jp2' }),
      getIngestOriginalUrl: () => of(''),
    },
  },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<StillImageComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / Still Image / Still Image',
  component: StillImageComponent,
  decorators: [
    moduleMetadata({
      providers: [
        { provide: OpenSeaDragonService, useValue: osdServiceStub },
        { provide: OsdDrawerService, useValue: osdDrawerServiceStub },
      ],
    }),
    applicationConfig({ providers: sharedProviders }),
    story => {
      const s = story();
      return {
        ...s,
        template: `<div style="height: 500px; background-color: #1a1a1a; display: flex; flex-direction: column">${s.template ?? '<app-still-image [resource]="resource" [compoundMode]="compoundMode" />'}</div>`,
      };
    },
  ],
  argTypes: {
    resource: {
      description: 'The ReadResource containing the image file value.',
      table: { type: { summary: 'ReadResource' }, category: 'Inputs' },
    },
    compoundMode: {
      description: 'When true, shows compound navigation arrows and slider.',
      table: { type: { summary: 'boolean' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<StillImageComponent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const InternalImage: Story = {
  name: 'Shows viewer for a DSP-hosted (internal) IIIF image',
  args: {
    resource: makeInternalResource(),
    compoundMode: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('OSD viewer container is rendered', async () => {
      await expect(canvasElement.querySelector('.osd-container')).not.toBeNull();
    });
    await step('No error message is shown', async () => {
      await expect(canvasElement.querySelector('app-no-results-found')).toBeNull();
    });
  },
};

export const ExternalIiifImage: Story = {
  name: 'Shows viewer for an external third-party IIIF image',
  args: {
    resource: makeExternalResource(),
    compoundMode: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('OSD viewer container is rendered', async () => {
      await expect(canvasElement.querySelector('.osd-container')).not.toBeNull();
    });
  },
};

export const NoImage: Story = {
  name: 'Shows error message when the resource has no image file value',
  args: {
    resource: makeEmptyResource(),
    compoundMode: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Error message component is rendered', async () => {
      await expect(canvasElement.querySelector('app-no-results-found')).not.toBeNull();
    });
    await step('OSD container is not rendered', async () => {
      await expect(canvasElement.querySelector('.osd-container')).toBeNull();
    });
  },
};

export const CompoundMode: Story = {
  name: 'Shows compound navigation arrows when in compound mode',
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: CompoundService,
          useValue: {
            compoundPosition: { page: 2, isLastPage: false, offset: 0, maxOffsets: 3, position: 1, totalPages: 5 },
            incomingResource$: of(undefined),
            onInit: () => {},
            openPage: () => {},
          },
        },
      ],
    }),
  ],
  args: {
    resource: makeInternalResource(),
    compoundMode: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('Compound arrow navigation components are rendered', async () => {
      const arrows = canvasElement.querySelectorAll('app-compound-arrow-navigation');
      await expect(arrows.length).toBe(2);
    });
  },
};
