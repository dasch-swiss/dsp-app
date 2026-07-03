import { provideRouter } from '@angular/router';
import { ResourceLegalV2ApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DspResource, ProjectDataRightsService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from './properties/properties-display/property-value/properties-display.service';
import { RegionService } from './representation/region.service';
import { ResourceFetcherService } from './representation/resource-fetcher.service';
import { ResourceImageTabsComponent } from './resource-image-tabs.component';

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
      entityInfo: { classes: {} },
    },
    resProps: [],
    incomingAnnotations: [],
  }) as unknown as DspResource;

const meta: Meta<ResourceImageTabsComponent> = {
  title: 'Resource Editor / 4. Properties / Resource Image Tabs / Resource Image Tabs',
  component: ResourceImageTabsComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: { doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }) },
              onto: { getOntology: () => of({}) },
            },
          },
        },
        {
          provide: PropertiesDisplayService,
          useValue: {
            showAllProperties$: of(false),
            showComments$: of(false),
            toggleShowProperties: () => {},
            toggleShowComments: () => {},
          },
        },
        {
          provide: RegionService,
          useValue: { regions$: of([]), regionsLoading$: of(false), selectedRegion$: of(null), showRegions: () => {} },
        },
        // The image tabs view embeds the rights-statement container; stub its data sources so it renders.
        provideRouter([{ path: '**', component: class {} }]),
        { provide: ProjectDataRightsService, useValue: { forProject: () => of({ authorship: [] }) } },
        { provide: ResourceLegalV2ApiService, useValue: { updateResourceAuthorship: () => of(undefined) } },
        { provide: ResourceFetcherService, useValue: { reload: () => {} } },
        { provide: UserService, useValue: { user$: of(null) } },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The DSP resource (with a still-image asset) to display inside the tabs.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceImageTabsComponent>;

export const DefaultView: Story = {
  name: 'Shows properties tab with toggle and display',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Properties tab label is rendered', async () => {
      const tab = canvasElement.querySelector('.mat-mdc-tab');
      await expect(tab).not.toBeNull();
    });
    await step('Properties display is rendered', async () => {
      const display = canvasElement.querySelector('app-properties-display');
      await expect(display).not.toBeNull();
    });
    await step('Properties toggle is rendered', async () => {
      const toggle = canvasElement.querySelector('app-properties-toggle');
      await expect(toggle).not.toBeNull();
    });
  },
};
