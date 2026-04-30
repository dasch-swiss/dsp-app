import { provideRouter } from '@angular/router';
import {
  Constants,
  ReadResource,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourcePlainComponent } from './resource-plain.component';
import { DEFAULT_HAS_PERMISSIONS, dspApiConnectionStub, makeEntityInfo, makePropEntry, makeTextPropDef, makeTextValue, resourceFetcherServiceStub } from './resource-stories.helper';

const makeResource = (permission = 'CR'): DspResource => {
  const titlePropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasTitle';
  const descriptionPropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasDescription';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const descriptionDef = makeTextPropDef(descriptionPropId, 'Description');
  const propEntries = [makePropEntry(titleDef, 0), makePropEntry(descriptionDef, 1)];

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://0.0.0.0:3333/ontology/0001/example/v2#Thing';
  res.label = 'My Storybook Resource';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Resource')],
    [descriptionPropId]: [makeTextValue('http://rdfh.ch/value/desc-1', 'A sample plain resource for Storybook previews.')],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'Thing');
  return generateDspResource(res);
};

const meta: Meta<ResourcePlainComponent> = {
  title: 'Resource Editor / Resource / Plain',
  component: ResourcePlainComponent,
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
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub() },
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The plain resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourcePlainComponent>;

export const DefaultView: Story = {
  name: 'Shows plain resource with header and properties tab',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Tab group is rendered', async () => {
      await expect(canvasElement.querySelector('mat-tab-group')).not.toBeNull();
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
