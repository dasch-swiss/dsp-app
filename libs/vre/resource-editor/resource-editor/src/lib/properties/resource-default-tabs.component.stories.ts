import { MatDialog } from '@angular/material/dialog';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from './properties-display/property-value/properties-display.service';
import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { ResourceLegalService } from './resource-legal.service';

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

const meta: Meta<ResourceDefaultTabsComponent> = {
  title: 'Resource Editor / 4. Properties / Resource Default Tabs / Resource Default Tabs',
  component: ResourceDefaultTabsComponent,
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
        // The default tabs view embeds the rights-statement container; stub its data sources so it renders.
        {
          provide: ProjectApiService,
          useValue: { get: () => of({ project: { shortcode: '0001', dataAuthorship: [] } }) },
        },
        { provide: PaginatedApiService, useValue: { getLicenses: () => of([]) } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } },
        { provide: ResourceLegalService, useValue: { updateResourceAuthorship: () => of(undefined) } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The DSP resource to display inside the tabs.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceDefaultTabsComponent>;

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
