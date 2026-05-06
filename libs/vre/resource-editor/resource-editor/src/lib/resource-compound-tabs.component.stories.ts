import { provideRouter } from '@angular/router';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { delay, of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';

import { CompoundService } from './compound/compound.service';
import { RegionService } from './representations/region.service';
import { ResourceCompoundTabsComponent } from './resource-compound-tabs.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { makeEntityInfo, makePropEntry, makeTextPropDef, makeTextValue } from './resource-stories.helper';

const makeResource = (): DspResource => {
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
  res.userHasPermission = 'CR';
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Compound')],
    [descriptionPropId]: [
      makeTextValue('http://rdfh.ch/value/desc-1', 'A sample compound resource for Storybook previews.'),
    ],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'Still Image Representation');
  return generateDspResource(res);
};

const sharedProviders = [
  provideRouter([{ path: '**', redirectTo: '' }]),
  {
    provide: AppConfigService,
    useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
  },
  {
    provide: ProjectApiService,
    useValue: { get: () => of({ project: { id: '', shortcode: '0001', shortname: 'test', longname: 'Test' } }) },
  },
  { provide: PropertiesDisplayService, useClass: PropertiesDisplayService },
  { provide: CompoundService, useValue: { incomingResource$: of(undefined) } },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        search: { doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }) },
      },
    },
  },
];

const meta: Meta<ResourceCompoundTabsComponent> = {
  title: 'Resource Editor / Resource / Compound / Compound Tabs',
  component: ResourceCompoundTabsComponent,
  argTypes: {
    resource: {
      description: 'The compound resource whose properties and annotations are shown in tabs.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceCompoundTabsComponent>;

export const PropertiesTab: Story = {
  name: 'Shows properties tab with no incoming resource and no region annotations',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: RegionService,
          useValue: { regions$: of([]), regionsLoading$: of(false), selectedRegion$: of(null), showRegions: () => {} },
        },
      ],
    }),
  ],
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Tab group is rendered', async () => {
      await expect(canvasElement.querySelector('mat-tab-group')).not.toBeNull();
    });
    await step('Only the properties tab is visible', async () => {
      const tabs = canvasElement.querySelectorAll('.mat-mdc-tab');
      await expect(tabs.length).toBe(1);
    });
  },
};

export const WithRegions: Story = {
  name: 'Shows annotations tab when regions are present',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: RegionService,
          useValue: {
            regions$: of([{ id: 'region1' } as any, { id: 'region2' } as any]).pipe(delay(0)),
            regionsLoading$: of(false),
            selectedRegion$: of(null),
            showRegions: () => {},
          },
        },
      ],
    }),
  ],
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Annotations tab appears after regions are loaded', async () => {
      await waitFor(
        () => {
          const tabs = canvasElement.querySelectorAll('.mat-mdc-tab');
          expect(tabs.length).toBe(2);
        },
        { timeout: 3000 }
      );
    });
  },
};
