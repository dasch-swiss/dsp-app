import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Constants,
  ReadResource,
  ReadTextValueAsString,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { of, throwError } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../stories.helpers';
import { BulkEditDialogComponent } from './bulk-edit-dialog.component';

const TYPE = 'http://0.0.0.0:3333/ontology/0001/webern/v2#Correspondence';
const ORT = 'http://0.0.0.0:3333/ontology/0001/webern/v2#hasOrt';

function textProperty(id: string, label: string, guiElement = Constants.GuiSimpleText): ResourcePropertyDefinition {
  return Object.assign(new ResourcePropertyDefinition(), {
    id,
    label,
    objectType: Constants.TextValue,
    guiElement,
    isEditable: true,
  });
}

function letter(id: string, label: string, ort?: string, properties = [textProperty(ORT, 'Ort')]): ReadResource {
  const resource = new ReadResource();
  resource.id = id;
  resource.label = label;
  resource.type = TYPE;
  resource.entityInfo = {
    classes: {
      [TYPE]: {
        getResourcePropertiesList: () => properties.map(propertyDefinition => ({ propertyDefinition })),
      } as unknown as ResourceClassDefinitionWithPropertyDefinition,
    },
    properties: {},
  } as unknown as ReadResource['entityInfo'];
  if (ort) {
    const value = Object.assign(new ReadTextValueAsString(), { id: `${id}/values/ort`, text: ort });
    resource.properties = { [ORT]: [value] };
  }
  return resource;
}

const letters = [
  letter('http://rdfh.ch/0001/berg', 'Brief an Alban Berg', 'Mödling'),
  letter('http://rdfh.ch/0001/schoenberg', 'Brief an Arnold Schönberg', 'Wien'),
  letter('http://rdfh.ch/0001/pisk', 'Brief an Paul Amadeus Pisk'),
];

const providers = (resources: ReadResource[]) => [
  ...STORY_PROVIDERS,
  { provide: MAT_DIALOG_DATA, useValue: { resourceIris: resources.map(resource => resource.id) } },
  { provide: MatDialogRef, useValue: { close: () => {}, disableClose: false } },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        res: { getResources: () => of({ resources }) },
        values: { updateValue: () => of({}), createValue: () => of({}) },
      },
    },
  },
];

const meta: Meta<BulkEditDialogComponent> = {
  title: 'Pages / Data Browser / Bulk Edit Dialog',
  component: BulkEditDialogComponent,
  argTypes: {},
  // The side panel's size, as the selection bar opens it.
  decorators: [componentWrapperDecorator(story => `<div style="width: 600px; height: 800px">${story}</div>`)],
};
export default meta;
type Story = StoryObj<BulkEditDialogComponent>;

export const PreviewsAReplaceAsYouType: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fill find and replace', async () => {
      await userEvent.type(await canvas.findByTestId('bulk-edit-find'), 'Wien');
      await userEvent.type(canvas.getByTestId('bulk-edit-replace-with'), 'Vienna');
    });
    await step('Only the matching value is previewed, with before and after', async () => {
      await expect(canvas.getByTestId('bulk-edit-preview-count')).toHaveTextContent('1 of 3 resources will change');
      await expect(canvas.getAllByTestId('bulk-edit-change')).toHaveLength(1);
      await expect(canvas.getByText('Wien')).toBeInTheDocument();
      await expect(canvas.getByText('Vienna')).toBeInTheDocument();
      await expect(canvas.getByTestId('bulk-edit-apply')).toHaveTextContent('Apply changes (1)');
    });
  },
};

export const SetsADefaultValueOnlyWhereEmptyAndReportsTheResult: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Choose Default value and type it', async () => {
      await userEvent.click(await canvas.findByText('Default value'));
      await userEvent.type(canvas.getByTestId('bulk-edit-default-value'), 'Wien');
    });
    await step('Only the letter without a place is changed', async () => {
      await expect(canvas.getAllByTestId('bulk-edit-change')).toHaveLength(1);
      await expect(canvas.getByText('Brief an Paul Amadeus Pisk')).toBeInTheDocument();
    });
    await step('Applying reports the updated count', async () => {
      await userEvent.click(canvas.getByTestId('bulk-edit-apply'));
      await waitFor(() => expect(canvas.getByTestId('bulk-edit-done')).toHaveTextContent('Values updated: 1'));
    });
  },
};

export const ListsAFailedValueAndOffersARetry: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...providers(letters),
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResources: () => of({ resources: letters }) },
              values: { updateValue: () => throwError(() => new Error('403')), createValue: () => of({}) },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Replace a value the API refuses', async () => {
      await userEvent.type(await canvas.findByTestId('bulk-edit-find'), 'Wien');
      await userEvent.type(canvas.getByTestId('bulk-edit-replace-with'), 'Vienna');
      await userEvent.click(canvas.getByTestId('bulk-edit-apply'));
    });
    await step('The failure is listed and can be retried', async () => {
      await waitFor(() => expect(canvas.getByTestId('bulk-edit-failed')).toHaveTextContent('not updated: 1'));
      await expect(canvas.getByTestId('bulk-edit-failed-change')).toHaveTextContent('Brief an Arnold Schönberg');
      await expect(canvas.getByTestId('bulk-edit-retry')).toBeInTheDocument();
    });
  },
};

export const ExplainsWhenThereIsNoPlainTextProperty: Story = {
  decorators: [
    applicationConfig({
      providers: providers([
        letter('http://rdfh.ch/0001/rich', 'Brief an Erwin Stein', undefined, [
          textProperty(ORT, 'Ort', Constants.GuiRichText),
        ]),
      ]),
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('bulk-edit-no-properties')).toBeInTheDocument();
  },
};
