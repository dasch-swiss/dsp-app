import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { DownloadPropertyListComponent } from './download-property-list.component';

const makePropertyInfoValues = (id: string, label: string, comment?: string): PropertyInfoValues =>
  ({
    propDef: { id, label, comment },
    guiDef: {},
    values: [],
  }) as unknown as PropertyInfoValues;

const sampleProperties: PropertyInfoValues[] = [
  makePropertyInfoValues('prop:title', 'Title', 'The title of the resource'),
  makePropertyInfoValues('prop:description', 'Description'),
  makePropertyInfoValues('prop:date', 'Date', 'Creation date'),
];

const meta: Meta<DownloadPropertyListComponent> = {
  title: 'Pages / Project / Download / Download Property List',
  component: DownloadPropertyListComponent,
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
    await step('Selected count shows 3 of 3', async () => {
      await expect(canvas.getByText(/3 of 3/)).toBeInTheDocument();
    });
  },
};

export const SelectNone: Story = {
  name: 'Deselects all properties when "Select None" is clicked',
  args: { propertyDefinitions: sampleProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click "Select None"', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Select None' }));
    });
    await step('Selected count shows 0 of 3', async () => {
      await expect(canvas.getByText(/0 of 3/)).toBeInTheDocument();
    });
  },
};

export const SelectAll: Story = {
  name: 'Re-selects all properties when "Select All" is clicked after deselecting',
  args: { propertyDefinitions: sampleProperties },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click "Select None" first', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Select None' }));
    });
    await step('Click "Select All"', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Select All' }));
    });
    await step('Selected count shows 3 of 3 again', async () => {
      await expect(canvas.getByText(/3 of 3/)).toBeInTheDocument();
    });
  },
};

export const WithPropertyComment: Story = {
  name: 'Shows property comment as a secondary description',
  args: { propertyDefinitions: [makePropertyInfoValues('prop:title', 'Title', 'The title of the resource')] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Property comment is displayed', async () => {
      await expect(canvas.getByText('The title of the resource')).toBeInTheDocument();
    });
  },
};
