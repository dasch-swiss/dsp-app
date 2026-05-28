import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';
import { STORY_PROVIDERS } from '../../../../stories.helpers';
import { LinkValueComponent } from './link-value.component';

const makeDynamicFormsStub = (resources: IriLabelPair[] = []) => ({
  searchResourcesByLabel$: () => of(resources),
  getResourcesListCount$: () => of(resources.length),
  getList$: () => of(undefined),
});

const SAMPLE_RESOURCES: IriLabelPair[] = [
  { iri: 'http://rdfh.ch/resource1', label: 'Resource One' },
  { iri: 'http://rdfh.ch/resource2', label: 'Resource Two' },
];

const meta: Meta<LinkValueComponent> = {
  title: 'Search / Advanced Search / Value Inputs / Link Value',
  component: LinkValueComponent,
  argTypes: {
    resourceClass: { description: 'IRI of the resource class to restrict the search to.' },
    selectedResource: { description: 'The currently selected linked resource.' },
    emitResourceSelected: { description: 'Emitted when the user selects a resource from the autocomplete.' },
  },
};
export default meta;
type Story = StoryObj<LinkValueComponent>;

export const ShowsSearchInput: Story = {
  name: 'Shows autocomplete input to search for linked resources',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Search input is rendered', async () => {
      const input = canvasElement.querySelector('input[matInput]');
      await expect(input).not.toBeNull();
    });
    await step('Placeholder text prompts the user to search', async () => {
      const input = canvasElement.querySelector('input[matInput]') as HTMLInputElement;
      await expect(input?.placeholder).toContain('Search');
    });
  },
};

export const ShowsMinLengthHint: Story = {
  name: 'Shows hint to type at least 3 characters before searching',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click into the search field', async () => {
      await userEvent.click(canvas.getByRole('textbox'));
    });
    await step('Hint about minimum characters is shown', async () => {
      await expect(document.body.textContent).toContain('3');
    });
  },
};

export const ShowsPreselectedResource: Story = {
  name: 'Shows the pre-selected resource label in the input',
  args: { selectedResource: SAMPLE_RESOURCES[0] },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub(SAMPLE_RESOURCES) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input shows the pre-selected resource label', async () => {
      const input = canvas.getByRole('textbox') as HTMLInputElement;
      await expect(input.value).toBe(SAMPLE_RESOURCES[0].label);
    });
  },
};

export const ShowsAutocompleteResultsAfterTyping: Story = {
  name: 'Shows autocomplete options after typing 3 or more characters',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub(SAMPLE_RESOURCES) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type 3+ characters into the input', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'Res');
    });
    await step('Autocomplete options are shown for matching resources', async () => {
      const options = document.querySelectorAll('mat-option:not([disabled])');
      await expect(options.length).toBeGreaterThan(0);
    });
  },
};

export const ShowsNoResultsMessage: Story = {
  name: 'Shows "no resources found" message when search returns empty',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub([]) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type 3+ characters that match nothing', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'zzz');
    });
    await step('No-results message is shown in the autocomplete panel', async () => {
      await expect(document.body.textContent).toContain('No resources found');
    });
  },
};

export const EmitsResourceSelectedOnOptionClick: Story = {
  name: 'Emits emitResourceSelected when an autocomplete option is chosen',
  args: { emitResourceSelected: fn() },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub(SAMPLE_RESOURCES) },
      ],
    }),
  ],
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('Type to trigger autocomplete', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'Res');
    });
    await step('Click the first non-disabled option', async () => {
      const option = Array.from(document.querySelectorAll('mat-option:not([disabled])')).find(
        o => o.textContent?.includes('Resource')
      ) as HTMLElement | undefined;
      await expect(option).toBeTruthy();
      await userEvent.click(option!);
    });
    await step('emitResourceSelected is emitted with the selected resource', async () => {
      await expect(args.emitResourceSelected).toHaveBeenCalledWith(
        expect.objectContaining({ iri: SAMPLE_RESOURCES[0].iri })
      );
    });
  },
};
