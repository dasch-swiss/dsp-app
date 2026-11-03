import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { DownloadPropertyListComponent } from './download-property-list.component';

const makePropertyInfoValues = (id: string, label: string, comment?: string): PropertyInfoValues =>
  ({
    propDef: {
      id,
      label,
      comment,
      labels: [{ language: 'en', value: label }],
      comments: comment ? [{ language: 'en', value: comment }] : [],
    },
    guiDef: {},
    values: [],
  }) as unknown as PropertyInfoValues;

const sampleProperties: PropertyInfoValues[] = [
  makePropertyInfoValues('prop:title', 'Title', 'The title of the resource'),
  makePropertyInfoValues('prop:description', 'Description'),
  makePropertyInfoValues('prop:date', 'Date', 'Creation date'),
];

const manyProperties: PropertyInfoValues[] = Array.from({ length: 100 }, (_, i) =>
  makePropertyInfoValues(`prop:p${i}`, `Property ${i + 1}`)
);

const longLabel =
  'Title of the journal, newspaper, collected edition or anthology in which the letter was first published';

const longProperties: PropertyInfoValues[] = [
  makePropertyInfoValues('prop:long', longLabel),
  makePropertyInfoValues('prop:unbroken', 'Herausgeberkommentarverweisungsnummernverzeichnis'),
  makePropertyInfoValues('prop:short', 'Date'),
];

// Labels in several languages: the filter must match whichever one the user types.
const multilingualProperty = {
  propDef: {
    id: 'prop:place',
    label: 'Place',
    labels: [
      { language: 'en', value: 'Place' },
      { language: 'de', value: 'Ort' },
    ],
    comments: [],
  },
  guiDef: {},
  values: [],
} as unknown as PropertyInfoValues;

const narrowDecorator = componentWrapperDecorator(
  story => `<div style="width: 320px; height: 360px; display: grid">${story}</div>`
);

const meta: Meta<DownloadPropertyListComponent> = {
  title: 'Pages / Project / Download / Download Property List',
  component: DownloadPropertyListComponent,
  // The dialog gives the list a fixed height; mirror that so the list has something to scroll in.
  decorators: [componentWrapperDecorator(story => `<div style="height: 360px; display: grid">${story}</div>`)],
  argTypes: {
    propertyDefinitions: {
      description: 'List of properties the user can include in the CSV export.',
      control: 'object',
      table: { type: { summary: 'PropertyInfoValues[]' }, category: 'Content' },
    },
    propertiesChange: {
      description: 'Emitted with selected property IDs whenever the selection changes.',
      table: { category: 'Events', type: { summary: 'EventEmitter<string[]>' } },
    },
  },
};
export default meta;
type Story = StoryObj<DownloadPropertyListComponent>;

const checkboxes = (canvasElement: HTMLElement) => within(canvasElement).getAllByRole('checkbox');

export const AllSelected: Story = {
  name: 'Shows all properties selected by default',
  args: { propertyDefinitions: sampleProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('All property labels are visible', async () => {
      await expect(canvas.getByText('Title')).toBeInTheDocument();
      await expect(canvas.getByText('Description')).toBeInTheDocument();
      await expect(canvas.getByText('Date')).toBeInTheDocument();
    });
    await step('Every checkbox is checked and the count shows 3 / 3', async () => {
      for (const checkbox of checkboxes(canvasElement)) await expect(checkbox).toBeChecked();
      await expect(canvas.getByText('3 / 3')).toBeInTheDocument();
    });
  },
};

export const SelectNone: Story = {
  name: 'Deselects all properties when the select-all checkbox is cleared',
  args: { propertyDefinitions: sampleProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Clear the select-all checkbox', async () => {
      await userEvent.click(canvas.getByRole('checkbox', { name: /Properties/ }));
    });
    await step('No checkbox is checked and the count shows 0 / 3', async () => {
      for (const checkbox of checkboxes(canvasElement)) await expect(checkbox).not.toBeChecked();
      await expect(canvas.getByText('0 / 3')).toBeInTheDocument();
    });
  },
};

export const PartialSelection: Story = {
  name: 'Shows the select-all checkbox as partial and selects all on click',
  args: { propertyDefinitions: sampleProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const selectAll = () => canvas.getByRole('checkbox', { name: /Properties/ });
    await step('Deselect one property', async () => {
      await userEvent.click(canvas.getByRole('checkbox', { name: 'Title' }));
    });
    await step('The select-all checkbox is partial and the count shows 2 / 3', async () => {
      await expect(selectAll()).toBePartiallyChecked();
      await expect(canvas.getByText('2 / 3')).toBeInTheDocument();
    });
    await step('Clicking it selects every property again', async () => {
      await userEvent.click(selectAll());
      for (const checkbox of checkboxes(canvasElement)) await expect(checkbox).toBeChecked();
    });
  },
};

export const FiltersByLabel: Story = {
  name: 'Narrows the list to properties matching the filter',
  args: { propertyDefinitions: sampleProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type "dat" into the filter', async () => {
      await userEvent.type(canvas.getByRole('textbox', { name: 'Filter properties' }), 'dat');
    });
    await step('Only "Date" remains', async () => {
      await expect(canvas.getByText('Date')).toBeInTheDocument();
      await expect(canvas.queryByText('Title')).not.toBeInTheDocument();
    });
    await step('A non-matching filter shows the empty message', async () => {
      await userEvent.type(canvas.getByRole('textbox', { name: 'Filter properties' }), 'xyz');
      await expect(canvas.getByText('No properties match the filter.')).toBeInTheDocument();
    });
  },
};

export const ScrollsWithManyProperties: Story = {
  name: 'Scrolls the list itself when there are 100 properties',
  args: { propertyDefinitions: manyProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The filter stays visible and the list overflows into its own scroll area', async () => {
      await expect(canvas.getByRole('textbox', { name: 'Filter properties' })).toBeVisible();
      const list = canvasElement.querySelector('[data-cy="download-property-list"]') as HTMLElement;
      await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    });
  },
};

export const TruncatesLongLabels: Story = {
  name: 'Truncates long labels without scrolling the list sideways',
  args: { propertyDefinitions: longProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const list = canvasElement.querySelector('[data-cy="download-property-list"]') as HTMLElement;
    await step('The list has no horizontal overflow', async () => {
      await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    });
    await step('The long and the unbroken labels are cut off with an ellipsis', async () => {
      for (const text of [longLabel, 'Herausgeberkommentarverweisungsnummernverzeichnis']) {
        const label = canvas.getByText(text);
        await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
        await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
      }
    });
  },
};

export const ShowsDescriptionAsTooltip: Story = {
  name: 'Shows the property description as a tooltip on hover',
  args: { propertyDefinitions: sampleProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Hover the "Title" property', async () => {
      // The tooltip is attached to the mat-checkbox host, not to its inner label.
      await userEvent.hover(canvas.getByText('Title').closest('mat-checkbox') as HTMLElement);
    });
    await step('Its description appears in a tooltip', async () => {
      // The text also sits in the CDK's hidden aria-describedby node, so target the tooltip itself.
      const tooltip = await within(document.body).findByText('The title of the resource', {
        selector: '.mat-mdc-tooltip-surface',
      });
      await expect(tooltip).toBeVisible();
    });
  },
};

export const FilterIgnoresCaseAndMatchesOtherLanguages: Story = {
  name: 'Matches the filter case-insensitively and in every label language',
  args: { propertyDefinitions: [...sampleProperties, multilingualProperty] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const filter = () => canvas.getByRole('textbox', { name: 'Filter properties' });
    await step('Upper case with surrounding spaces still finds "Date"', async () => {
      await userEvent.type(filter(), '  DATE ');
      await expect(canvas.getByText('Date')).toBeInTheDocument();
      await expect(canvas.queryByText('Title')).not.toBeInTheDocument();
    });
    await step('The German label "Ort" finds the "Place" property', async () => {
      await userEvent.clear(filter());
      await userEvent.type(filter(), 'ort');
      await expect(canvas.getByText('Place')).toBeInTheDocument();
      await expect(canvas.queryByText('Date')).not.toBeInTheDocument();
    });
  },
};

export const SelectAllCoversFilteredOutProperties: Story = {
  name: 'Applies the select-all checkbox to every property, not only the filtered ones',
  args: { propertyDefinitions: manyProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Filter down to "Property 10"', async () => {
      await userEvent.type(canvas.getByRole('textbox', { name: 'Filter properties' }), 'Property 10');
    });
    await step('Clearing the select-all checkbox deselects all 100 properties', async () => {
      await userEvent.click(canvas.getByRole('checkbox', { name: /Properties/ }));
      await expect(canvas.getByText('0 / 100')).toBeInTheDocument();
    });
  },
};

export const SingleColumnWhenNarrow: Story = {
  name: 'Stacks the properties in one column on a narrow panel',
  args: { propertyDefinitions: sampleProperties },
  decorators: [narrowDecorator],
  play: async ({ canvasElement, step }) => {
    await step('Every property checkbox starts at the same horizontal position', async () => {
      const items = Array.from(canvasElement.querySelectorAll('[data-cy="download-property-list"] mat-checkbox'));
      const lefts = new Set(items.map(item => Math.round(item.getBoundingClientRect().left)));
      await expect(lefts.size).toBe(1);
    });
  },
};
