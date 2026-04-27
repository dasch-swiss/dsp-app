import { FormBuilder } from '@angular/forms';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { PropertyValueCreatorComponent } from './property-value-creator.component';

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

const meta: Meta<PropertyValueCreatorComponent> = {
  title: 'Devs / Resource Creator / Property Value Creator',
  component: PropertyValueCreatorComponent,
  argTypes: {
    myProperty: {
      description: 'Property definition with GUI settings and current values.',
      table: { type: { summary: 'PropertyInfoValues' }, category: 'State' },
    },
    formGroup: {
      description: 'FormGroup with item and comment controls for this value.',
      table: { type: { summary: 'FormValueGroup' }, category: 'State' },
    },
    template: {
      description: 'TemplateRef for the value editor injected by the parent.',
      table: { type: { summary: 'TemplateRef<any>' }, category: 'State' },
    },
    canRemoveValue: {
      description: 'Whether the remove button is visible.',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    removeValue: {
      description: 'Emitted when the user clicks the remove button.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Outputs' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueCreatorComponent>;

export const DefaultView: Story = {
  name: 'Shows add-comment button when template is provided',
  render: () => ({
    template: `
      <ng-template #tpl let-item="item">
        <input [formControl]="item" data-cy="value-input" />
      </ng-template>
      <app-property-value-creator
        [myProperty]="myProperty"
        [formGroup]="formGroup"
        [template]="tpl"
        [canRemoveValue]="false" />
    `,
    props: {
      myProperty: makeMyProperty(),
      formGroup: new FormBuilder().group({
        item: new FormBuilder().control(null),
        comment: new FormBuilder().control(null),
      }),
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Action buttons container is rendered', async () => {
      const buttons = canvasElement.querySelectorAll('button[mat-icon-button]');
      await expect(buttons.length).toBeGreaterThan(0);
    });
  },
};
