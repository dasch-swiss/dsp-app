import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from './properties-display.service';
import { PropertyValueDisplayCommentComponent } from './property-value-display-comment.component';
import { PropertyValueService } from './property-value.service';

const makePropertyValueServiceStub = (comment: string | null): Partial<PropertyValueService> => ({
  editModeData: {
    resource: { id: 'http://rdfh.ch/resource/1', type: 'http://example.org/Thing' } as any,
    values: [
      {
        id: 'http://rdfh.ch/values/1',
        type: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
        valueHasComment: comment,
      } as any,
    ],
  },
});

const meta: Meta<PropertyValueDisplayCommentComponent> = {
  title:
    'Devs / Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Property Value / Properties Display / Property Value Display Comment',
  component: PropertyValueDisplayCommentComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertiesDisplayService, useValue: { showComments$: of(true) } },
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('This is a comment.') },
      ],
    }),
  ],
  argTypes: {
    index: {
      description: 'Index of the value in editModeData.values to read the comment from.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueDisplayCommentComponent>;

export const WithComment: Story = {
  name: 'Shows comment when showComments is true and comment exists',
  args: { index: 0 },
  play: async ({ canvasElement, step }) => {
    await step('Comment element is rendered', async () => {
      const comment = canvasElement.querySelector('[data-cy="property-value-comment"]');
      await expect(comment).not.toBeNull();
    });
    await step('Comment text is displayed', async () => {
      await expect(canvasElement.textContent).toContain('This is a comment.');
    });
  },
};

export const HiddenWhenCommentsOff: Story = {
  name: 'Hides comment when showComments is false',
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertiesDisplayService, useValue: { showComments$: of(false) } },
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('This is a comment.') },
      ],
    }),
  ],
  args: { index: 0 },
  play: async ({ canvasElement, step }) => {
    await step('Comment element is not rendered', async () => {
      const comment = canvasElement.querySelector('[data-cy="property-value-comment"]');
      await expect(comment).toBeNull();
    });
  },
};

export const HiddenWhenNoComment: Story = {
  name: 'Hides comment when value has no comment',
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertiesDisplayService, useValue: { showComments$: of(true) } },
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub(null) },
      ],
    }),
  ],
  args: { index: 0 },
  play: async ({ canvasElement, step }) => {
    await step('Comment element is not rendered when comment is null', async () => {
      const comment = canvasElement.querySelector('[data-cy="property-value-comment"]');
      await expect(comment).toBeNull();
    });
  },
};
