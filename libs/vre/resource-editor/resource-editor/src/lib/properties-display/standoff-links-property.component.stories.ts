import { importProvidersFrom } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from '../resource-properties/properties-display.service';
import { StandoffLinksPropertyComponent } from './standoff-links-property.component';

const makeResource = () =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'Test Resource',
      properties: {},
    },
    resProps: [],
    incomingRepresentations: [],
  }) as any;

const meta: Meta<StandoffLinksPropertyComponent> = {
  title: 'Devs / Resource Editor / Properties Display / Standoff Links Property',
  component: StandoffLinksPropertyComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        { provide: MatDialog, useValue: { open: () => {}, openDialogs: [] } },
        { provide: PropertiesDisplayService, useValue: { showAllProperties$: of(true), showComments$: of(false) } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The DspResource whose standoff links are extracted and displayed.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<StandoffLinksPropertyComponent>;

export const NoStandoffLinks: Story = {
  name: 'Shows empty standoff links property row',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Property row is rendered', async () => {
      const row = canvasElement.querySelector('.property-row');
      await expect(row).not.toBeNull();
    });
  },
};
