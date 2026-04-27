import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CreateResourceDialogComponent } from './create-resource-dialog.component';

const makeDialogData = () => ({
  resourceType: 'Thing',
  resourceClassIri: 'http://example.org/onto#Thing',
  projectIri: 'http://rdfh.ch/projects/test',
  projectShortcode: 'test',
});

const makeOntologyStub = (resourceClassIri: string) => ({
  classes: {
    [resourceClassIri]: {
      id: resourceClassIri,
      label: 'Thing',
      getResourcePropertiesList: () => [],
    },
  },
  properties: {},
});

const meta: Meta<CreateResourceDialogComponent> = {
  title: 'Devs / Resource Editor / Resource Properties / Template Switcher / Create Resource Dialog',
  component: CreateResourceDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: makeDialogData() },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              ontologyCache: {
                reloadCachedItem: () => of(null),
                getResourceClassDefinition: (iri: string) => of(makeOntologyStub(iri)),
              },
              res: { createResource: () => of({ id: 'http://rdfh.ch/resource/new' }) },
            },
          },
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<CreateResourceDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows create resource dialog with form inside',
  play: async ({ canvasElement, step }) => {
    await step('Dialog content container is rendered', async () => {
      const dialog = canvasElement.querySelector('[data-cy="create-resource-dialog"]');
      await expect(dialog).not.toBeNull();
    });
  },
};
