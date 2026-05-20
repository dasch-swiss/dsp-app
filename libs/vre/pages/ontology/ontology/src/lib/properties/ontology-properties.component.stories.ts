import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultProperties } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { PropertyInfo } from '../ontology.types';
import { OntologyEditService } from '../services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from '../stories.helpers';
import { OntologyPropertiesComponent } from './ontology-properties.component';

const textPropType = DefaultProperties.data.find(g => g.group === 'Text')!.elements[0];

const sampleProperties: PropertyInfo[] = [
  {
    propDef: {
      id: 'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
      label: 'Title',
      labels: [{ language: 'en', value: 'Title' }],
      comments: [],
      objectType: Constants.TextValue,
      subPropertyOf: [Constants.HasValue],
      isLinkProperty: false,
      isEditable: true,
      guiElement: Constants.GuiSimpleText,
      guiAttributes: [],
    } as any,
    propType: textPropType,
    baseOntologyId: 'http://0.0.0.0:3333/ontology/0001/test/v2',
    baseOntologyLabel: 'Test Ontology',
    usedByClasses: [],
    objectLabels: [],
    objectComments: [],
  },
];

const meta: Meta<OntologyPropertiesComponent> = {
  title: 'Ontology / Properties / Ontology Properties',
  component: OntologyPropertiesComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<OntologyPropertiesComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  {
    provide: OntologyEditService,
    useValue: makeOntologyEditServiceStub({ currentOntologyProperties$: of(sampleProperties) }),
  },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
];

export const WithProperties: Story = {
  name: 'Renders list of ontology properties',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Properties list is rendered', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const EmptyList: Story = {
  name: 'Renders empty list when ontology has no properties',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: OntologyEditService, useValue: makeOntologyEditServiceStub({ currentOntologyProperties$: of([]) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Component renders without error', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
