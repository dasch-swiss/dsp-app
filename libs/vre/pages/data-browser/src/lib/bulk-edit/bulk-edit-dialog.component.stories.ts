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
import { APIV3ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
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
      Object.assign(new ReadTextValueAsString(), { id: `${id}/values/ort`, text: ort, userHasPermission: 'D' }),
    ];
  }
  if (art) {
    resource.properties[ART] = [
      Object.assign(new ReadListValue(), {
        id: `${id}/values/art`,
        userHasPermission: 'D',
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
  { provide: APIV3ApiService, useValue: { postV3ResourcesValuesBatch: batchAnswering('ok') } },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        res: { getResourcesBatch: () => of({ resources }), updateResourceMetadata: () => of({}) },
        values: { updateValue: () => of({}), createValue: () => of({}), deleteValue: () => of({}) },
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

/** The batch route, answering every change with `status`, or only updates when `updatesOnly`. */
function batchAnswering(status: string, updatesOnly = false) {
  return (body: { changes: { value?: string }[] }) =>
    of({
      results: body.changes.map((change, index) => ({
        index,
        status: updatesOnly && !change.value ? 'ok' : status,
      })),
    });
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
  decorators: [componentWrapperDecorator(story => `<div style="width: 1100px; height: 800px">${story}</div>`)],
};
export default meta;
type Story = StoryObj<BulkEditDialogComponent>;

export const OpensOnTheLabel: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('bulk-edit-property')).toHaveTextContent('Label');
  },
};

export const ListsTheLabelThenThePropertiesWithoutTypes: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('bulk-edit-property'));
    const options = await within(document.body).findAllByRole('option');
    await expect(options.map(option => option.textContent?.trim())).toEqual(['Label', 'Art', 'Ort']);
    await expect(within(document.body).getByRole('group', { name: 'Properties' })).toBeInTheDocument();
  },
};

export const SetsADefaultValueOnlyWhereEmptyAndReportsTheResult: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Set value is offered first and only fills empty values; type the value', async () => {
      await choose(canvas, 'bulk-edit-property', 'Ort');
      await expect(within(await canvas.findByTestId('bulk-edit-choice-empty')).getByRole('radio')).toBeChecked();
      await expect(canvas.getByTestId('bulk-edit-choice-empty-count')).toHaveTextContent('1');
      await typeValue(canvas, 0, 'Wien');
    });
    await step('Only the letter without a place gets a value', async () => {
      await expect(canvas.getByTestId('bulk-edit-group-new')).toHaveTextContent('Gets a value');
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
              res: { getResourcesBatch: () => of({ resources: letters }) },
              list: {
                getList: () => of(correspondenceTypes),
                getListWithAllLanguages: () => of(correspondenceTypes),
              },
              values: { updateValue: () => throwError(() => new Error('403')), createValue: () => of({}) },
            },
          },
        },
        // The batch route refuses the update: the stored place changed since the preview.
        { provide: APIV3ApiService, useValue: { postV3ResourcesValuesBatch: batchAnswering('conflict', true) } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Overwrite a value the API refuses', async () => {
      await choose(canvas, 'bulk-edit-property', 'Ort');
      await typeValue(canvas, 0, 'Wien');
      await userEvent.click(within(canvas.getByTestId('bulk-edit-choice-replace')).getByRole('radio'));
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
      await expect(canvas.getByText('Brief an Arnold Schönberg', { selector: 'del' })).toBeInTheDocument();
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
    await choose(canvas, 'bulk-edit-property', 'Kommentar');
    await expect(await valueEditor(canvas, 0)).toBeInTheDocument();
  },
};

export const ReplacesASingleValueWhenAskedTo: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Type a value and choose to also replace the current value', async () => {
      await choose(canvas, 'bulk-edit-property', 'Ort');
      await typeValue(canvas, 0, 'Wien');
      await userEvent.click(within(canvas.getByTestId('bulk-edit-choice-replace')).getByRole('radio'));
    });
    await step('The empty place is filled and the other one replaced, each in its group', async () => {
      await expect(canvas.getByTestId('bulk-edit-group-new')).toHaveTextContent('Gets a value');
      await expect(canvas.getByTestId('bulk-edit-group-replaced')).toHaveTextContent('Mödling');
      await expect(canvas.getAllByTestId('bulk-edit-change')).toHaveLength(2);
      await expect(canvas.getByTestId('bulk-edit-apply')).toHaveTextContent('Apply to 2 resource(s)');
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

    await step('With one value, replacing can be chosen', async () => {
      await choose(canvas, 'bulk-edit-property', 'Ort');
      await expect(within(await canvas.findByTestId('bulk-edit-choice-replace')).getByRole('radio')).toBeEnabled();
    });
    await step('Add a second value, which rules replacing out', async () => {
      await typeValue(canvas, 0, 'Wien');
      // The creation form's own add button: an icon only, hidden from the accessibility tree.
      const add = within(canvas.getByTestId('bulk-edit-values')).getByText('add_circle').closest('button');
      await userEvent.click(add!);
      await typeValue(canvas, 1, 'Mödling');
      await expect(within(canvas.getByTestId('bulk-edit-choice-replace')).getByRole('radio')).toBeDisabled();
      await expect(canvas.getByTestId('bulk-edit-choice-replace')).toHaveTextContent(
        'Only possible with one new value'
      );
    });
    await step('The postcard without a place gets both values', async () => {
      await expect(canvas.getAllByTestId('bulk-edit-change')).toHaveLength(1);
      await expect(canvas.getByText('Postkarte an Paul Amadeus Pisk')).toBeInTheDocument();
      await expect(canvas.getByTestId('bulk-edit-apply')).toHaveTextContent('Apply to 1 resource(s)');
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
      await choose(canvas, 'bulk-edit-property', 'Ort');
      await typeValue(canvas, 0, 'Wien');
    });
    await step('The postcard the user may only view is not changed, and the preview says why', async () => {
      await userEvent.click(within(canvas.getByTestId('bulk-edit-group-unchanged')).getByRole('button'));
      await expect(canvas.getByTestId('bulk-edit-reason-noRights')).toHaveTextContent('You may not edit: 1');
      await expect(canvas.queryAllByTestId('bulk-edit-change')).toHaveLength(0);
      await expect(canvas.getByTestId('bulk-edit-apply')).toBeDisabled();
    });
  },
};

export const RemovesValuesAfterAConfirmation: Story = {
  decorators: [applicationConfig({ providers: providers(letters) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Choose Ort and Remove values', async () => {
      await choose(canvas, 'bulk-edit-property', 'Ort');
      await userEvent.click(within(await canvas.findByTestId('bulk-edit-action-remove')).getByRole('radio'));
    });
    await step('The two places are previewed as removed, with a red card', async () => {
      await expect(canvas.getByTestId('bulk-edit-remove-card')).toHaveTextContent('Every Ort is removed');
      await expect(canvas.getByTestId('bulk-edit-group-removed')).toHaveTextContent('Values removed');
      await expect(canvas.getByTestId('bulk-edit-apply')).toHaveTextContent('Remove values from 2 resource(s)');
    });
    await step('Removing asks once more, then reports the result', async () => {
      await userEvent.click(canvas.getByTestId('bulk-edit-apply'));
      await expect(canvas.getByTestId('bulk-edit-confirm')).toHaveTextContent('Remove 2 value(s) from 2 resource(s)?');
      await userEvent.click(canvas.getByTestId('bulk-edit-confirm-remove'));
      await waitFor(() => expect(canvas.getByTestId('bulk-edit-done')).toHaveTextContent('Values removed: 2'));
    });
  },
};

export const LocksRemovingARequiredProperty: Story = {
  decorators: [
    applicationConfig({
      providers: providers(
        letters.map(({ id, label }) => letter(id, label, 'Wien', undefined, undefined, { [ORT]: Cardinality._1 }))
      ),
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await choose(canvas, 'bulk-edit-property', 'Ort');
    await expect(within(await canvas.findByTestId('bulk-edit-action-remove')).getByRole('radio')).toBeDisabled();
    await expect(canvas.getByTestId('bulk-edit-remove-required')).toHaveTextContent('Every resource must have a Ort');
  },
};

export const OffersADateForRemovingOnly: Story = {
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('The date is tagged “Remove only” in the picker', async () => {
      await userEvent.click(await canvas.findByTestId('bulk-edit-property'));
      await userEvent.click(await within(document.body).findByRole('option', { name: /Datum/ }));
      // Once chosen, the field shows the property alone, without the tag.
      await expect(canvas.getByTestId('bulk-edit-property')).toHaveTextContent(/^\s*Datum\s*$/);
    });
    await step('Setting is locked and removing, its one action, is chosen', async () => {
      await expect(within(canvas.getByTestId('bulk-edit-action-set')).getByRole('radio')).toBeDisabled();
      await expect(canvas.getByTestId('bulk-edit-set-unsupported')).toBeInTheDocument();
      await expect(within(canvas.getByTestId('bulk-edit-action-remove')).getByRole('radio')).toHaveAttribute(
        'aria-checked',
        'true'
      );
      await expect(canvas.getByTestId('bulk-edit-remove-card')).toBeInTheDocument();
    });
    await step('With no date to remove, nothing can be applied', async () => {
      await expect(canvas.getByTestId('bulk-edit-apply')).toBeDisabled();
    });
  },
};
