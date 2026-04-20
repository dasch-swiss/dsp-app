import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { Cardinality } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { PropertiesDisplayService } from '../resource-properties/properties-display.service';
import { PropertiesDisplayComponent } from './properties-display.component';

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

const meta: Meta<PropertiesDisplayComponent> = {
  title: 'Devs / Resource Editor / Properties Display / Properties Display',
  component: PropertiesDisplayComponent,
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
        { provide: PropertiesDisplayService, useValue: { showAllProperties$: of(false), showComments$: of(false), toggleShowProperties: () => {}, toggleShowComments: () => {} } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The DSP resource whose properties are displayed.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
    linkToNewTab: {
      description: 'Optional IRI to open links in a new tab.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    parentResourceId: {
      description: 'IRI of the parent resource when displayed in compound context.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertiesDisplayComponent>;

export const NoProperties: Story = {
  name: 'Shows info message when resource has no editable properties',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Property row is rendered', async () => {
      const row = canvasElement.querySelector('app-property-row');
      await expect(row).not.toBeNull();
    });
    await step('Standoff links component is rendered', async () => {
      const standoff = canvasElement.querySelector('app-standoff-links-property');
      await expect(standoff).not.toBeNull();
    });
  },
};
