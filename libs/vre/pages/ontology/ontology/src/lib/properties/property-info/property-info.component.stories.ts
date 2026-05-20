import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultProperties } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { PropertyInfo } from '../../ontology.types';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { PropertyInfoComponent } from './property-info.component';

const textPropType = DefaultProperties.data.find(g => g.group === 'Text')!.elements[0];

const sampleProperty: PropertyInfo = {
  propDef: {
    id: 'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
    label: 'Title',
    labels: [{ language: 'en', value: 'Title' }],
    comments: [{ language: 'en', value: 'The title of the resource' }],
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
};

const meta: Meta<PropertyInfoComponent> = {
  title: 'Ontology / Properties / Property Info',
  component: PropertyInfoComponent,
  argTypes: {
    property: {
      description: 'The property info object to display.',
      table: { type: { summary: 'PropertyInfo' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyInfoComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
];

export const DefaultView: Story = {
  name: 'Displays property name and type',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: { property: sampleProperty },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Component renders without error', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const ReadOnlyForNonAdmin: Story = {
  name: 'Hides action buttons for non-admin users',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ hasProjectAdminRights$: of(false) }) },
      ],
    }),
  ],
  args: { property: sampleProperty },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('No delete button visible', async () => {
      await expect(canvas.queryByRole('button', { name: /delete/i })).toBeNull();
    });
  },
};
