import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CreateResourceFormComponent } from './create-resource-form.component';

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

const meta: Meta<CreateResourceFormComponent> = {
  title: 'Devs / Resource Editor / Resource Creator / Create Resource Form',
  component: CreateResourceFormComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(TranslateModule.forRoot()),
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              ontologyCache: {
                reloadCachedItem: () => of(null),
                getResourceClassDefinition: (iri: string) => of(makeOntologyStub(iri)),
              },
              res: {
                createResource: () => of({ id: 'http://rdfh.ch/resource/new' }),
              },
            },
          },
        },
      ],
    }),
  ],
  argTypes: {
    resourceClassIri: {
      description: 'IRI of the resource class to create an instance of.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    projectIri: {
      description: 'IRI of the project the resource will belong to.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Shortcode of the project.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    createdResourceIri: {
      description: 'Emitted with the IRI of the newly created resource.',
      table: { type: { summary: 'EventEmitter<string>' }, category: 'Outputs' },
    },
    cancelled: {
      description: 'Emitted when the user cancels the form.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Outputs' },
    },
  },
};
export default meta;
type Story = StoryObj<CreateResourceFormComponent>;

export const DefaultView: Story = {
  name: 'Shows label input, cancel and submit buttons',
  args: {
    resourceClassIri: 'http://example.org/onto#Thing',
    projectIri: 'http://rdfh.ch/projects/test',
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Label input is rendered', async () => {
      const labelInput = canvasElement.querySelector('[data-cy="label-input"]');
      await expect(labelInput).not.toBeNull();
    });
    await step('Cancel button is rendered', async () => {
      const cancelButton = canvasElement.querySelector('[data-cy="cancel-button"]');
      await expect(cancelButton).not.toBeNull();
    });
    await step('Submit button is rendered', async () => {
      const submitButton = canvasElement.querySelector('[data-cy="submit-button"]');
      await expect(submitButton).not.toBeNull();
    });
  },
};
