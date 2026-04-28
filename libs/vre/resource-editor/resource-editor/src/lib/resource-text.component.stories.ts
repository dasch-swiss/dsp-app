import { provideRouter } from '@angular/router';
import {
  Constants,
  IHasPropertyWithPropertyDefinition,
  ReadResource,
  ReadTextFileValue,
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

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceTextComponent } from './resource-text.component';

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
    type: Constants.TextFileValue,
    fileUrl: 'https://example.org/document.txt',
    filename: 'document.txt',
    userHasPermission: 'RV',
    copyrightHolder: null,
    authorship: [],
    license: null,
  } as unknown as ReadTextFileValue;

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#TextRepresentation';
  res.label = 'My Storybook Text';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasTextFileValue]: [fileValue],
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Text')],
    [descriptionPropId]: [makeTextValue('http://rdfh.ch/value/desc-1', 'A sample text resource for Storybook previews.')],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries);
  return generateDspResource(res);
};

const meta: Meta<ResourceTextComponent> = {
  title: 'Resource Editor / Resource / Text',
  component: ResourceTextComponent,
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
          useValue: { getFileInfo: () => of({ originalFilename: 'document.txt' }), downloadProjectFile: () => {} },
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
      description: 'The text resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceTextComponent>;

export const DefaultView: Story = {
  name: 'Shows text resource with header, legal info, representation and properties tab',
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
