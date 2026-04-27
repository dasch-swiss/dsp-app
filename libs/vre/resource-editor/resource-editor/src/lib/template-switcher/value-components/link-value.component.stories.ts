import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { LinkValueDataService } from './link-value-data.service';
import { LinkValueComponent } from './link-value.component';

const linkValueDataServiceStub: Partial<LinkValueDataService> = {
  onInit: () => {},
  resourceClasses: [],
};

const dspApiConnectionStub = {
  v2: {
    ontologyCache: {
      getOntology: () => of(new Map()),
      getResourceClassDefinition: () => of({ classes: {}, properties: {} }),
    },
    search: {
      doSearchByLabel: () => of({ resources: [] }),
    },
  },
};

const meta: Meta<LinkValueComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Template Switcher / Link Value',
  component: LinkValueComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
        { provide: LinkValueDataService, useValue: linkValueDataServiceStub },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(null) }) } },
      ],
    }),
  ],
  argTypes: {
    control: {
      description: 'FormControl bound to the linked resource IRI.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
    propIri: {
      description: 'IRI of the link property.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    resourceClassIri: {
      description: 'IRI of the target resource class constraint.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    projectIri: {
      description: 'IRI of the project.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Shortcode of the project.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<LinkValueComponent>;

export const Empty: Story = {
  name: 'Shows empty search input for linked resource',
  args: {
    control: new FormControl<string | null>(null),
    propIri: 'http://api.dasch.swiss/ontology/0001/anything/v2#hasOtherThing',
    resourceClassIri: 'http://api.dasch.swiss/ontology/0001/anything/v2#Thing',
    projectIri: 'http://rdfh.ch/projects/0001',
    projectShortcode: '0001',
  },
  play: async ({ canvasElement, step }) => {
    await step('Link search input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="link-input"]');
      await expect(input).not.toBeNull();
    });
  },
};
