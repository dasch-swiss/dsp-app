import { provideRouter } from '@angular/router';
import {
  Constants,
  IHasPropertyWithPropertyDefinition,
  ReadAudioFileValue,
  ReadResource,
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
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceAudioComponent } from './resource-audio.component';
import { SegmentsService } from './segment-support/segments.service';

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
  const titlePropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasTitle';
  const descriptionPropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasDescription';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const descriptionDef = makeTextPropDef(descriptionPropId, 'Description');
  const propEntries = [makePropEntry(titleDef, 0), makePropEntry(descriptionDef, 1)];

  const fileValue = {
    type: Constants.AudioFileValue,
    fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    filename: 'audio.mp3',
    userHasPermission: 'RV',
    copyrightHolder: null,
    authorship: [],
    license: null,
  } as unknown as ReadAudioFileValue;

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#AudioRepresentation';
  res.label = 'My Storybook Audio';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasAudioFileValue]: [fileValue],
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Audio')],
    [descriptionPropId]: [makeTextValue('http://rdfh.ch/value/desc-1', 'A sample audio resource for Storybook previews.')],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries);
  return generateDspResource(res);
};

const segmentsServiceStub: Partial<SegmentsService> = {
  segments: [],
  onInit: () => {},
  playSegment$: new Subject<any>().asObservable(),
  highlightSegment$: new Subject<any>().asObservable(),
};

const meta: Meta<ResourceAudioComponent> = {
  title: 'Resource Editor / Resource / Audio',
  component: ResourceAudioComponent,
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
          useValue: { get: () => of({ project: { id: '', shortcode: '0001', shortname: 'test', longname: 'Test' } }) },
        },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false), projectShortcode$: of('0001') } },
        {
          provide: RepresentationService,
          useValue: { getFileInfo: () => of({ originalFilename: 'audio.mp3' }), downloadProjectFile: () => {} },
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
    moduleMetadata({
      providers: [{ provide: SegmentsService, useFactory: () => segmentsServiceStub }],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The audio resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceAudioComponent>;

export const DefaultView: Story = {
  name: 'Shows audio resource with header, legal info, player and media tabs',
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
