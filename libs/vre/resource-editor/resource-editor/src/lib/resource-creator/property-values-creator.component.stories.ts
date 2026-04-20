import { importProvidersFrom } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { PropertyValuesCreatorComponent } from './property-values-creator.component';

const makeMyProperty = () =>
  ({
    propDef: {
      id: 'http://example.org/prop',
      label: 'Integer Value',
      objectType: Constants.IntValue,
      comment: '',
    },
    guiDef: {
      cardinality: Cardinality._0_n,
      isInherited: false,
      propertyIndex: 'http://example.org/prop',
      propertyDefinition: {
        label: 'Integer Value',
        id: 'http://example.org/prop',
        objectType: Constants.IntValue,
      } as any,
    } as any,
    values: [],
  }) as any;

const makeFormArray = () =>
  new FormArray([
    new FormBuilder().group({ item: new FormBuilder().control(null), comment: new FormBuilder().control(null) }),
  ]) as any;

const meta: Meta<PropertyValuesCreatorComponent> = {
  title: 'Devs / Resource Editor / Resource Creator / Property Values Creator',
  component: PropertyValuesCreatorComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(TranslateModule.forRoot())],
    }),
  ],
  argTypes: {
    myProperty: {
      description: 'Property definition with GUI settings and current values.',
      table: { type: { summary: 'PropertyInfoValues' }, category: 'State' },
    },
    formArray: {
      description: 'FormArray holding the value groups for each property value.',
      table: { type: { summary: 'FormValueArray' }, category: 'State' },
    },
    resourceClassIri: {
      description: 'IRI of the resource class.',
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
type Story = StoryObj<PropertyValuesCreatorComponent>;

export const DefaultView: Story = {
  name: 'Shows template editor switcher for the given property',
  args: {
    myProperty: makeMyProperty(),
    formArray: makeFormArray(),
    resourceClassIri: 'http://example.org/onto#Thing',
    projectIri: 'http://rdfh.ch/projects/test',
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Template editor switcher is rendered', async () => {
      const switcher = canvasElement.querySelector('app-template-editor-switcher');
      await expect(switcher).not.toBeNull();
    });
  },
};
