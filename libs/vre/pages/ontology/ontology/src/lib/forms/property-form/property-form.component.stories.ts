import { provideAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { DefaultProperties } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { PropertyFormComponent } from './property-form.component';

const textPropType = DefaultProperties.data.find(g => g.group === 'Text')!.elements[0];

const meta: Meta<PropertyFormComponent> = {
  title: 'Ontology Editor / 3b. Properties Tab / Edit Property Form Dialog / Property Form',
  component: PropertyFormComponent,
  argTypes: {
    propertyData: {
      description: 'Dialog data describing the property type and optional pre-filled fields.',
      table: { type: { summary: 'EditPropertyDialogData' }, category: 'Inputs' },
    },
    afterFormInit: {
      description: 'Emitted once the form group is built.',
      table: { type: { summary: 'PropertyForm' }, category: 'Outputs' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyFormComponent>;

const sharedDecorators = [
  applicationConfig({
    providers: [
      provideAnimations(),
      ...STORY_PROVIDERS,
      { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
    ],
  }),
];

export const CreateTextProperty: Story = {
  name: 'Renders form for creating a short-text property',
  decorators: sharedDecorators,
  args: {
    propertyData: {
      propType: textPropType,
      guiElement: Constants.GuiSimpleText,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Name input is present', async () => {
      await expect(canvas.getByTestId('name-input')).toBeInTheDocument();
    });
    await step('Label input is present', async () => {
      await expect(canvas.getByTestId('label-input')).toBeInTheDocument();
    });
  },
};

export const EditExistingProperty: Story = {
  name: 'Pre-fills form fields when editing an existing property',
  decorators: sharedDecorators,
  args: {
    propertyData: {
      id: 'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
      propType: textPropType,
      name: 'hasTitle',
      label: [{ language: 'en', value: 'Title' }],
      comment: [{ language: 'en', value: 'The title of a resource' }],
      guiElement: Constants.GuiSimpleText,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Comment textarea is present', async () => {
      await expect(canvas.getByTestId('comment-textarea')).toBeInTheDocument();
    });
  },
};
