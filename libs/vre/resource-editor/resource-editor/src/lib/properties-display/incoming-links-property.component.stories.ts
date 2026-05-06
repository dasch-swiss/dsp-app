import { importProvidersFrom } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from '../resource-properties/properties-display.service';
import { IncomingLinksPropertyComponent } from './incoming-links-property.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
  }) as any;

const makeEmptySequence = () => ({ resources: [], mayHaveMoreResults: false });

const meta: Meta<IncomingLinksPropertyComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display /Incoming, standoff / Incoming Links Property',
  component: IncomingLinksPropertyComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        { provide: MatDialog, useValue: { open: () => {}, openDialogs: [] } },
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { search: { doSearchIncomingLinks: () => of(makeEmptySequence()) } } },
        },
        { provide: PropertiesDisplayService, useValue: { showAllProperties$: of(true), showComments$: of(false) } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource whose incoming links are fetched and displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IncomingLinksPropertyComponent>;

export const NoIncomingLinks: Story = {
  name: 'Shows empty incoming links property row',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Property row is rendered', async () => {
      const row = canvasElement.querySelector('.property-row');
      await expect(row).not.toBeNull();
    });
  },
};
