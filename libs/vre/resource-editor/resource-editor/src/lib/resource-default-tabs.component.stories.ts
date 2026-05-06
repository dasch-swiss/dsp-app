import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';

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
