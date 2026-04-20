import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { CompoundService } from './compound/compound.service';
import { RegionService } from './representations/region.service';
import { ResourceTabsComponent } from './resource-tabs.component';
import { SegmentsService } from './segment-support/segments.service';

const makeResource = (): DspResource =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'Test Resource',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      properties: {},
      entityInfo: { classes: { 'http://example.org/Thing': { label: 'Thing' } } },
    },
    resProps: [],
    incomingAnnotations: [],
  }) as unknown as DspResource;

const meta: Meta<ResourceTabsComponent> = {
  title: 'Devs / Resource Editor / Resource / Resource Tabs',
  component: ResourceTabsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(TranslateModule.forRoot()),
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
          provide: SegmentsService,
          useValue: {
            segments: [],
            highlightSegment$: of(null),
          },
        },
        {
          provide: CompoundService,
          useValue: {
            incomingResource$: of(undefined),
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
      description: 'The DSP resource to display tabs for.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
    annotationIri: {
      description: 'Optional annotation IRI to highlight a specific annotation.',
      table: { type: { summary: 'string | null' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceTabsComponent>;

export const DefaultView: Story = {
  name: 'Shows properties tab for a resource without representations',
  args: {
    resource: makeResource(),
    annotationIri: null,
  },
  play: async ({ canvasElement, step }) => {
    await step('Tab group is rendered', async () => {
      const tabGroup = canvasElement.querySelector('mat-tab-group');
      await expect(tabGroup).not.toBeNull();
    });
  },
};
