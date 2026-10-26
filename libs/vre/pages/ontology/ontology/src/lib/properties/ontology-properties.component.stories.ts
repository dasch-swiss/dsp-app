import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultProperties } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
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
  title: 'Ontology Editor / 3b. Properties Tab / Ontology Properties',
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
    await step('Properties list is rendered', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

const manyClasses = Array.from({ length: 30 }, (_, i) => ({
  id: `http://0.0.0.0:3333/ontology/0001/test/v2#Class${i}`,
  labels: [{ language: 'en', value: `Resource Class ${i}` }],
  comments: [],
}));

export const LongUsedInListWraps: Story = {
  name: 'Wraps a long "used in" list instead of cutting it off',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: OntologyEditService,
          useValue: makeOntologyEditServiceStub({
            currentOntologyProperties$: of([{ ...sampleProperties[0], usedByClasses: manyClasses }]),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The last class is shown inside the list item', async () => {
      const item = canvasElement.querySelector('mat-list-item')!.getBoundingClientRect();
      const last = (await canvas.findByText('Resource Class 29')).getBoundingClientRect();
      await expect(last.right).toBeLessThanOrEqual(item.right);
      await expect(last.bottom).toBeLessThanOrEqual(item.bottom);
    });
  },
};

export const NarrowCardKeepsContentInside: Story = {
  name: 'Keeps a long property id and class names inside a narrow card',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: OntologyEditService,
          useValue: makeOntologyEditServiceStub({
            currentOntologyProperties$: of([
              {
                ...sampleProperties[0],
                propDef: {
                  ...sampleProperties[0].propDef,
                  id: 'http://0.0.0.0:3333/ontology/0001/test/v2#letterHasRepertoriumNumber',
                },
                usedByClasses: manyClasses.slice(0, 3),
              } as PropertyInfo,
            ]),
          }),
        },
      ],
    }),
    componentWrapperDecorator(story => `<div style="width: 134px">${story}</div>`),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Nothing in the card runs past its right edge', async () => {
      const card = canvasElement.querySelector<HTMLElement>('.property-info')!;
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
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
    await step('Component renders without error', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
