import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Cardinality,
  Constants,
  ListNodeV2,
  ReadListValue,
  ReadResource,
  ReadTextValueAsString,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { of, throwError } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../stories.helpers';
import { BulkEditDialogComponent } from './bulk-edit-dialog.component';

const TYPE = 'http://0.0.0.0:3333/ontology/0001/webern/v2#Correspondence';
const ORT = 'http://0.0.0.0:3333/ontology/0001/webern/v2#hasOrt';
const ART = 'http://0.0.0.0:3333/ontology/0001/webern/v2#hasArt';
const LIST_ROOT = 'http://rdfh.ch/lists/0001/correspondence-types';

function textProperty(id: string, label: string, guiElement = Constants.GuiSimpleText): ResourcePropertyDefinition {
  return Object.assign(new ResourcePropertyDefinition(), {
    id,
    label,
    objectType: Constants.TextValue,
    guiElement,
    isEditable: true,
  });
}

const artProperty = Object.assign(new ResourcePropertyDefinition(), {
  id: ART,
  label: 'Art',
  objectType: Constants.ListValue,
  guiElement: Constants.GuiList,
  guiAttributes: [`hlist=<${LIST_ROOT}>`],
  isEditable: true,
});

function node(id: string, label: string, children: ListNodeV2[] = []): ListNodeV2 {
  return Object.assign(new ListNodeV2(), { id: `${LIST_ROOT}/${id}`, label, children });
}

const correspondenceTypes = node('root', 'Correspondence types', [
  node('brief', 'Brief', [
    node('handschriftlich', 'handschriftlich'),
    node('maschinenschriftlich', 'maschinenschriftlich'),
  ]),
  node('postkarte', 'Postkarte'),
]);

function letter(
  id: string,
  label: string,
  ort?: string,
  art?: string,
  properties = [textProperty(ORT, 'Ort'), artProperty],
  cardinalities: Record<string, Cardinality> = {}
): ReadResource {
  const resource = new ReadResource();
  resource.id = id;
  resource.label = label;
  resource.type = TYPE;
  resource.userHasPermission = 'M';
  resource.entityInfo = {
    classes: {
      [TYPE]: {
        getResourcePropertiesList: () =>
          properties.map(propertyDefinition => ({
            propertyDefinition,
            cardinality: cardinalities[propertyDefinition.id] ?? Cardinality._0_1,
          })),
      } as unknown as ResourceClassDefinitionWithPropertyDefinition,
    },
    properties: {},
  } as unknown as ReadResource['entityInfo'];
  resource.properties = {};
  if (ort) {
    resource.properties[ORT] = [
      Object.assign(new ReadTextValueAsString(), { id: `${id}/values/ort`, text: ort, userHasPermission: 'M' }),
    ];
  }
  if (art) {
    resource.properties[ART] = [
      Object.assign(new ReadListValue(), {
        id: `${id}/values/art`,
        userHasPermission: 'M',
        listNode: `${LIST_ROOT}/${art}`,
        listNodeLabel: art,
      }),
    ];
  }
  return resource;
}

const letters = [
  letter('http://rdfh.ch/0001/berg', 'Brief an Alban Berg', 'Mödling', 'brief'),
  letter('http://rdfh.ch/0001/schoenberg', 'Brief an Arnold Schönberg', 'Wien', 'brief'),
  letter('http://rdfh.ch/0001/pisk', 'Postkarte an Paul Amadeus Pisk', undefined, 'postkarte'),
];

const providers = (resources: ReadResource[]) => [
  ...STORY_PROVIDERS,
  { provide: MAT_DIALOG_DATA, useValue: { resourceIris: resources.map(resource => resource.id) } },
  { provide: MatDialogRef, useValue: { close: () => {}, disableClose: false } },
  { provide: ResourceService, useValue: { getProjectShortcode: () => '0001' } },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        res: { getResources: () => of({ resources }), updateResourceMetadata: () => of({}) },
        values: { updateValue: () => of({}), createValue: () => of({}) },
        list: {
          getList: () => of(correspondenceTypes),
          getListWithAllLanguages: () => of(correspondenceTypes),
        },
      },
    },
  },
];

/** The n-th value editor of the resource creation form, as the panel shows it. */
async function valueEditor(canvas: ReturnType<typeof within>, index: number) {
  const editors = await within(await canvas.findByTestId('bulk-edit-values')).findAllByTestId('value-editor');
  return editors[index];
}

/** Types into the n-th value: the label's own input, or the text box of the creation form's editor. */
async function typeValue(canvas: ReturnType<typeof within>, index: number, text: string) {
  const label = canvas.queryByTestId('bulk-edit-value-0');
  const input = label ?? (await within(await valueEditor(canvas, index)).findByRole('textbox'));
  await userEvent.type(input, text);
}

/** mat-select options open in an overlay outside the story's canvas. */
async function choose(canvas: ReturnType<typeof within>, selectTestId: string, option: string) {
  await userEvent.click(await canvas.findByTestId(selectTestId));
  await userEvent.click(await within(document.body).findByRole('option', { name: option }));
}

const meta: Meta<BulkEditDialogComponent> = {
  title: 'Pages / Data Browser / Bulk Edit Dialog',
  component: BulkEditDialogComponent,
  argTypes: {},
  // The side panel's size, as the selection bar opens it.
  decorators: [componentWrapperDecorator(story => `<div style="width: 600px; height: 800px">${story}</div>`)],
};
export default meta;
type Story = StoryObj<BulkEditDialogComponent>;

export const SetsADefaultValueOnlyWhereEmptyAndReportsTheResult: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Set value is offered first and only fills empty values; type the value', async () => {
      await expect(await canvas.findByTestId('bulk-edit-only-empty')).toHaveTextContent('Only update empty values');
      await typeValue(canvas, 0, 'Wien');
    });
    await step('Only the letter without a place is changed', async () => {
      await expect(canvas.getAllByTestId('bulk-edit-change')).toHaveLength(1);
      await expect(canvas.getByText('Postkarte an Paul Amadeus Pisk')).toBeInTheDocument();
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
              list: {
                getList: () => of(correspondenceTypes),
                getListWithAllLanguages: () => of(correspondenceTypes),
              },
              values: { updateValue: () => throwError(() => new Error('403')), createValue: () => of({}) },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Overwrite a value the API refuses', async () => {
      await typeValue(canvas, 0, 'Wien');
      await userEvent.click(within(canvas.getByTestId('bulk-edit-only-empty')).getByRole('checkbox'));
      await userEvent.click(canvas.getByTestId('bulk-edit-apply'));
    });
    await step('The failure is listed and can be retried', async () => {
      await waitFor(() => expect(canvas.getByTestId('bulk-edit-failed')).toHaveTextContent('not updated: 1'));
      await expect(canvas.getByTestId('bulk-edit-failed-change')).toHaveTextContent('Brief an Alban Berg');
      await expect(canvas.getByTestId('bulk-edit-retry')).toBeInTheDocument();
    });
  },
};

export const SetsTheSameLabelOnEveryResource: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Choose the label and type it', async () => {
      await choose(canvas, 'bulk-edit-property', 'Label');
      await typeValue(canvas, 0, 'Brief an Alban Berg');
    });
    await step('The two other resources get the label', async () => {
      await expect(canvas.getByTestId('bulk-edit-preview-count')).toHaveTextContent('2 of 3 resources will change');
      await expect(canvas.getByText('Brief an Arnold Schönberg')).toBeInTheDocument();
    });
    await step('Applying updates both labels', async () => {
      await userEvent.click(canvas.getByTestId('bulk-edit-apply'));
      await waitFor(() => expect(canvas.getByTestId('bulk-edit-done')).toHaveTextContent('Values updated: 2'));
    });
  },
};

export const OffersTheListEditorOfResourceCreation: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Choose the list property', async () => {
      await choose(canvas, 'bulk-edit-property', 'Art');
    });
    await step('The list editor of resource creation is offered, and nothing is planned yet', async () => {
      await expect(await valueEditor(canvas, 0)).toBeInTheDocument();
      await expect(canvas.getByTestId('bulk-edit-apply')).toBeDisabled();
    });
  },
};

export const OffersTheRichTextEditorOfResourceCreation: Story = {
  decorators: [
    applicationConfig({
      providers: providers([
        letter('http://rdfh.ch/0001/stein', 'Brief an Erwin Stein', undefined, undefined, [
          textProperty(ORT, 'Kommentar', Constants.GuiRichText),
        ]),
      ]),
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('bulk-edit-property')).toHaveTextContent('Kommentar');
    await expect(await valueEditor(canvas, 0)).toBeInTheDocument();
  },
};

export const OverwritesASingleValueWhenOnlyEmptyIsUnticked: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Type a value and untick Only update empty values', async () => {
      await typeValue(canvas, 0, 'Wien');
      await userEvent.click(within(canvas.getByTestId('bulk-edit-only-empty')).getByRole('checkbox'));
    });
    await step('The two existing places are overwritten, with a warning', async () => {
      await expect(canvas.getByTestId('bulk-edit-overwrite-warning')).toHaveTextContent(
        'Existing values overwritten: 1'
      );
      await expect(canvas.getAllByTestId('bulk-edit-change')).toHaveLength(2);
      await expect(canvas.getByText('Mödling')).toBeInTheDocument();
      await expect(canvas.getByTestId('bulk-edit-apply')).toHaveTextContent('Apply changes (2)');
    });
  },
};

export const FillsAMultiValuePropertyWithSeveralValues: Story = {
  decorators: [
    applicationConfig({
      providers: providers(
        letters.map(({ id, label }) =>
          letter(id, label, id.endsWith('pisk') ? undefined : 'Wien', undefined, undefined, {
            [ORT]: Cardinality._0_n,
          })
        )
      ),
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('With one value, only empty is ticked and can be changed', async () => {
      const onlyEmpty = within(await canvas.findByTestId('bulk-edit-only-empty')).getByRole('checkbox');
      await expect(onlyEmpty).toBeChecked();
      await expect(onlyEmpty).toBeEnabled();
    });
    await step('Add a second value, which locks only empty', async () => {
      await typeValue(canvas, 0, 'Wien');
      // The creation form's own add button.
      await userEvent.click(within(canvas.getByTestId('bulk-edit-values')).getByRole('button', { name: /add_circle/ }));
      await typeValue(canvas, 1, 'Mödling');
      await expect(within(canvas.getByTestId('bulk-edit-only-empty')).getByRole('checkbox')).toBeDisabled();
    });
    await step('The postcard without a place gets both values', async () => {
      await expect(canvas.getAllByTestId('bulk-edit-change')).toHaveLength(1);
      await expect(canvas.getByText('Postkarte an Paul Amadeus Pisk')).toBeInTheDocument();
      await expect(canvas.getByTestId('bulk-edit-apply')).toHaveTextContent('Apply changes (2)');
    });
  },
};

export const SkipsResourcesTheUserMayNotEdit: Story = {
  decorators: [
    applicationConfig({
      // A fresh postcard: the shared letters must keep their rights for the other stories.
      providers: providers([
        ...letters.slice(0, 2),
        Object.assign(letter('http://rdfh.ch/0001/pisk', 'Postkarte an Paul Amadeus Pisk', undefined, 'postkarte'), {
          userHasPermission: 'V',
        }),
      ]),
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Set a place where it is empty', async () => {
      await typeValue(canvas, 0, 'Wien');
    });
    await step('The postcard the user may only view is skipped, and the panel says so', async () => {
      await expect(canvas.getByTestId('bulk-edit-no-rights')).toHaveTextContent(
        'Resources you may not edit are skipped: 1'
      );
      await expect(canvas.queryAllByTestId('bulk-edit-change')).toHaveLength(0);
      await expect(canvas.getByTestId('bulk-edit-apply')).toBeDisabled();
    });
  },
};

export const OffersTheLabelWhenNoPropertyCanBeEdited: Story = {
  decorators: [
    applicationConfig({
      providers: providers([
        letter('http://rdfh.ch/0001/date', 'Brief an Erwin Stein', undefined, undefined, [
          Object.assign(new ResourcePropertyDefinition(), {
            id: ORT,
            label: 'Datum',
            objectType: Constants.DateValue,
            guiElement: Constants.GuiDatePicker,
            isEditable: true,
          }),
        ]),
      ]),
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('bulk-edit-property')).toHaveTextContent('Label');
  },
};
