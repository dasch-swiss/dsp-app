import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CompoundService } from './compound/compound.service';
import { RegionService } from './representations/region.service';
import { ResourceCompoundTabsComponent } from './resource-compound-tabs.component';

const makeResource = (): DspResource =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'Test Compound Resource',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      properties: {},
      entityInfo: { classes: { 'http://example.org/Thing': { label: 'Thing' } } },
      getValues: () => [],
    },
    resProps: [],
    incomingAnnotations: [],
  }) as unknown as DspResource;

const meta: Meta<ResourceCompoundTabsComponent> = {
  title: 'Devs / Resource Editor / Resource / Compound Tabs',
  component: ResourceCompoundTabsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(TranslateModule.forRoot()),
        {
          provide: CompoundService,
          useValue: { incomingResource$: of(undefined) },
        },
        {
          provide: RegionService,
          useValue: {
            regions$: of([]),
            regionsLoading$: of(false),
            selectedRegion$: of(null),
            showRegions: () => {},
          },
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
      description: 'The compound resource whose properties and annotations are shown in tabs.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceCompoundTabsComponent>;

export const PropertiesTab: Story = {
  name: 'Shows properties tab with no incoming resource and no region annotations',
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
        importProvidersFrom(TranslateModule.forRoot()),
        {
          provide: CompoundService,
          useValue: { incomingResource$: of(undefined) },
        },
        {
          provide: RegionService,
          useValue: {
            regions$: of([{ id: 'region1' }, { id: 'region2' }]),
            regionsLoading$: of(false),
            selectedRegion$: of(null),
            showRegions: () => {},
          },
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
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Two tabs are rendered (properties + annotations)', async () => {
      const tabs = canvasElement.querySelectorAll('.mat-mdc-tab');
      await expect(tabs.length).toBe(2);
    });
  },
};
