import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  ApiResponseError,
  Constants,
  IHasPropertyWithPropertyDefinition,
  ReadMovingImageFileValue,
  ReadResource,
  ReadTextValueAsString,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of, throwError } from 'rxjs';
import { expect, within } from 'storybook/test';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherComponent } from './resource-fetcher.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// generateDspResource (called inside ResourceFetcherService) reads
// res.entityInfo.classes[res.type].getResourcePropertiesList() and entityInfo.properties.
// A bare ReadResource has entityInfo undefined, so we must provide a minimal stub that
// registers the resource type in classes with an empty property list.
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
  propEntries: IHasPropertyWithPropertyDefinition[] = [],
  classLabel = 'Thing'
): ResourceClassAndPropertyDefinitions => {
  const classStub = {
    label: classLabel,
    getResourcePropertiesList: () => propEntries,
    propertiesList: propEntries,
  } as unknown as ResourceClassDefinitionWithPropertyDefinition;
  return new ResourceClassAndPropertyDefinitions({ [resourceType]: classStub }, {});
};

const makeVideoReadResource = (): ReadResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.attachedToProject = 'http://rdfh.ch/project/1';
  res.attachedToUser = 'http://rdfh.ch/user/1';
  res.label = 'My Storybook Video';
  res.userHasPermission = 'RV';
  res.creationDate = '2024-03-15T10:30:00Z';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#MovingImageRepresentation';

  const titlePropId = 'http://0.0.0.0:3333/ontology/0869/example/v2#hasTitle';
  const descriptionPropId = 'http://0.0.0.0:3333/ontology/0869/example/v2#hasDescription';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const descriptionDef = makeTextPropDef(descriptionPropId, 'Description');
  const propEntries = [makePropEntry(titleDef, 0), makePropEntry(descriptionDef, 1)];

  res.properties = {
    [Constants.HasMovingImageFileValue]: [
      {
        type: Constants.MovingImageFileValue,
        fileUrl: 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file',
        filename: 'video.mp4',
        userHasPermission: 'RV',
      } as unknown as ReadMovingImageFileValue,
    ],
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Video')],
    [descriptionPropId]: [
      makeTextValue('http://rdfh.ch/value/desc-1', 'A sample video resource for Storybook previews.'),
    ],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'Moving Image');
  return res;
};

const makeDeletedReadResource = (): ReadResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/deleted';
  res.type = Constants.DeletedResource;
  res.deleteComment = 'Duplicate entry removed.';
  res.attachedToProject = 'http://rdfh.ch/project/1';
  res.attachedToUser = 'http://rdfh.ch/user/1';
  res.properties = {};
  res.entityInfo = makeEntityInfo(res.type, [], 'Deleted Resource');
  return res;
};

const makeApiError = (status: number): ApiResponseError => {
  const err = Object.create(ApiResponseError.prototype) as ApiResponseError;
  err.status = status;
  return err;
};

// ---------------------------------------------------------------------------
// Shared stubs (service-level, not DspApiConnectionToken-level)
// ---------------------------------------------------------------------------

// AppConfigService is providedIn: 'root' and its constructor runs Zod validation.
// Stub it directly so no validation occurs.
const appConfigServiceStub = {
  dspApiConfig: { apiUrl: '' },
  dspAppConfig: { iriBase: 'http://rdfh.ch' },
};

// ProjectApiService is providedIn: 'root' and extends BaseApi which reads
// AppConfigService.dspApiConfig.apiUrl in its constructor.
// Stub it directly so the constructor never runs.
const projectApiServiceStub = {
  get: () =>
    of({
      project: {
        id: 'http://rdfh.ch/project/1',
        shortcode: '0869',
        shortname: 'my-project',
        longname: 'My Storybook Project',
      },
    }),
};

const sharedProviders = [
  importProvidersFrom(OverlayModule),
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: AppConfigService, useValue: appConfigServiceStub },
  { provide: ProjectApiService, useValue: projectApiServiceStub },
  {
    provide: AdminAPIApiService,
    useValue: {
      getAdminProjectsIriProjectiri: () =>
        of({
          project: {
            id: 'http://rdfh.ch/project/1',
            shortcode: '0869',
            shortname: 'my-project',
            longname: 'My Storybook Project',
          },
        }),
      getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ licenses: [] }),
    },
  },
  { provide: UserApiService, useValue: { get: () => of({ user: { givenName: 'Jane', familyName: 'Doe' } }) } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  {
    provide: RepresentationService,
    useValue: { getFileInfo: () => of({ originalFilename: 'video.mp4' }), downloadProjectFile: () => {} },
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<ResourceFetcherComponent> = {
  title: 'Resource Editor / Resource Fetcher',
  component: ResourceFetcherComponent,
  argTypes: {
    resourceIri: {
      description: 'The IRI of the resource to load. Triggers a new fetch whenever it changes.',
      table: { type: { summary: 'string' }, category: 'Inputs' },
    },
    afterResourceDeleted: {
      description: 'Emitted when the fetched resource has been marked as deleted.',
      table: { category: 'Outputs', type: { summary: 'EventEmitter<ReadResource>' } },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceFetcherComponent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const ResourceFetched: Story = {
  name: 'Shows the resource viewer once the resource has been fetched',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        // getResource returns the video resource immediately so ngOnInit's subscription
        // drives the component into the fetched state via ResourceFetcherService.resource$.
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResource: () => of(makeVideoReadResource()) },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
      ],
    }),
  ],
  args: { resourceIri: 'http://rdfh.ch/resource/1' },
  play: async ({ canvasElement, step }) => {
    await step('Resource component is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-dispatcher')).not.toBeNull();
    });
  },
};

export const Loading: Story = {
  name: 'Shows progress indicator while the resource is being fetched',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        // NEVER ensures loadResource()'s getResource() call never emits,
        // keeping the component in the loading state.
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResource: () => NEVER },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
      ],
    }),
  ],
  args: { resourceIri: 'http://rdfh.ch/resource/1' },
  play: async ({ canvasElement, step }) => {
    await step('Progress indicator is rendered', async () => {
      await expect(canvasElement.querySelector('app-progress-indicator')).not.toBeNull();
    });
    await step('Resource component is not yet rendered', async () => {
      await expect(canvasElement.querySelector('app-resource')).toBeNull();
    });
  },
};

export const NotFound: Story = {
  name: 'Shows progress indicator while fetching a resource that does not exist',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: {
                getResource: () => throwError(() => makeApiError(404)),
              },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
      ],
    }),
  ],
  args: { resourceIri: 'http://rdfh.ch/resource/missing' },
  play: async ({ canvasElement, step }) => {
    await step('Progress indicator is rendered while resource loads', async () => {
      await expect(canvasElement.querySelector('app-progress-indicator')).not.toBeNull();
    });
  },
};

export const Unauthorized: Story = {
  name: 'Shows progress indicator while fetching a restricted resource',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: {
                getResource: () => throwError(() => makeApiError(403)),
              },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
      ],
    }),
  ],
  args: { resourceIri: 'http://rdfh.ch/resource/restricted' },
  play: async ({ canvasElement, step }) => {
    await step('Progress indicator is rendered while resource loads', async () => {
      await expect(canvasElement.querySelector('app-progress-indicator')).not.toBeNull();
    });
  },
};

export const Deleted: Story = {
  name: 'Shows deleted message with comment when the resource was soft-deleted',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: {
                getResource: () => of(makeDeletedReadResource()),
              },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
      ],
    }),
  ],
  args: { resourceIri: 'http://rdfh.ch/resource/deleted' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Deleted heading is displayed', async () => {
      const heading = canvas.getByRole('heading', { level: 3 });
      await expect(heading).toBeInTheDocument();
    });
    await step('Delete comment is shown', async () => {
      await expect(canvas.getByText(/Duplicate entry removed/)).toBeInTheDocument();
    });
  },
};
