import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';
import { STORY_PROVIDERS } from '../../../../stories.helpers';
import { toLabels } from '../../../../util/labels';
import { LinkValueComponent } from './link-value.component';

const makeDynamicFormsStub = (resources: IriLabelPair[] = []) => ({
  searchResourcesByLabel$: () => of(resources),
  getResourcesListCount$: () => of(resources.length),
  getList$: () => of(undefined),
});

const SAMPLE_RESOURCES: IriLabelPair[] = [
  { iri: 'http://rdfh.ch/resource1', labels: toLabels('Resource One'), comments: [] },
  { iri: 'http://rdfh.ch/resource2', labels: toLabels('Resource Two'), comments: [] },
];

const meta: Meta<LinkValueComponent> = {
  title:
    'Search / Advanced Search / Search bar / 4. Add Filter Button / Filter Editor Popover / Statement Builder / Value Inputs / Link Value',
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
      providers: [...STORY_PROVIDERS, { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() }],
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
      providers: [...STORY_PROVIDERS, { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub() }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Click into the search field', async () => {
      await userEvent.click(canvasElement.querySelector('input[matInput]') as HTMLElement);
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
    await step('Input shows the pre-selected resource label', async () => {
      const input = canvasElement.querySelector('input[matInput]') as HTMLInputElement;
      await expect(input.value).toBe(SAMPLE_RESOURCES[0].labels[0].value);
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
    await step('Type 3+ characters into the input', async () => {
      await userEvent.type(canvasElement.querySelector('input[matInput]') as HTMLElement, 'Res');
    });
    await step('Autocomplete options are shown for matching resources', async () => {
      await waitFor(async () => {
        const options = document.querySelectorAll('mat-option:not([disabled])');
        await expect(options.length).toBeGreaterThan(0);
      });
    });
  },
};

export const ShowsNoResultsMessage: Story = {
  name: 'Shows "no resources found" message when search returns empty',
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub([]) }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Type 3+ characters that match nothing', async () => {
      await userEvent.type(canvasElement.querySelector('input[matInput]') as HTMLElement, 'zzz');
    });
    await step('No-results message is shown in the autocomplete panel', async () => {
      await waitFor(async () => {
        await expect(document.body.textContent).toContain('No resources found');
      });
    });
  },
};

export const SelectsResourceFromAutocomplete: Story = {
  name: 'Fills input with the selected resource label after choosing an autocomplete option',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: DynamicFormsDataService, useValue: makeDynamicFormsStub(SAMPLE_RESOURCES) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Type to trigger autocomplete', async () => {
      await userEvent.type(canvasElement.querySelector('input[matInput]') as HTMLElement, 'Res');
    });
    await step('Wait for options to appear', async () => {
      await waitFor(async () => {
        const option = Array.from(document.querySelectorAll('mat-option:not([disabled])')).find(o =>
          o.textContent?.includes('Resource')
        ) as HTMLElement | undefined;
        await expect(option).toBeTruthy();
        await userEvent.click(option!);
      });
    });
    await step('Input is filled with the selected resource label', async () => {
      await waitFor(async () => {
        const input = canvasElement.querySelector('input[matInput]') as HTMLInputElement;
        await expect(input.value).toBe(SAMPLE_RESOURCES[0].labels[0].value);
      });
    });
  },
};
