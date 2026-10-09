import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { OntologyDataService } from '@dasch-swiss/vre/pages/search/search-filters';
import {
  ConfirmedSearchStateService,
  EMPTY_SEARCH_STATE,
  SearchFilterState,
  StatementDraftStore,
} from '@dasch-swiss/vre/pages/search/search-filters';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { DerivedSearchState, DerivedSearchStateService } from '../../service/derived-search-state.service';
import {
  makeDerivedSearchStateServiceStub,
  makeOntologyDataServiceStub,
  SAMPLE_RESOURCE_CLASSES,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { ResourceClassChipComponent } from './resource-class-chip.component';

const derivationWithClass = (resourceClass: DerivedSearchState['resourceClass']) => ({
  provide: DerivedSearchStateService,
  useValue: makeDerivedSearchStateServiceStub({
    searchState$: of({ resourceClass, statements: [], orderByItems: [] }),
  }),
});

const meta: Meta<ResourceClassChipComponent> = {
  title: 'Search / Advanced Search / Search bar / 2. Resource Class Chip',
  component: ResourceClassChipComponent,
};
export default meta;
type Story = StoryObj<ResourceClassChipComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  derivationWithClass(null),
  { provide: SearchFilterState, useValue: EMPTY_SEARCH_STATE as unknown as SearchFilterState },
  ConfirmedSearchStateService,
  StatementDraftStore,
];

export const ShowsAllResourceClasses: Story = {
  name: 'Shows "All resource classes" when no class is selected',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        derivationWithClass(null),
        // StatementDraftStore gained a ConfirmedSearchStateService dependency when the shared lib was
        // extracted, and that service reads the SearchFilterState port. Both have to be here or the
        // store cannot be constructed.
        { provide: SearchFilterState, useValue: EMPTY_SEARCH_STATE as unknown as SearchFilterState },
        ConfirmedSearchStateService,
        StatementDraftStore,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Button shows the "all resources" label', async () => {
      await expect(canvas.getByText('All resources', { exact: false })).toBeTruthy();
    });
  },
};

export const ShowsSelectedClass: Story = {
  name: 'Shows selected resource class label on button',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        derivationWithClass(SAMPLE_RESOURCE_CLASSES[0]),
        // StatementDraftStore gained a ConfirmedSearchStateService dependency when the shared lib was
        // extracted, and that service reads the SearchFilterState port. Both have to be here or the
        // store cannot be constructed.
        { provide: SearchFilterState, useValue: EMPTY_SEARCH_STATE as unknown as SearchFilterState },
        ConfirmedSearchStateService,
        StatementDraftStore,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Button shows selected class label', async () => {
      await expect(canvas.getByText(SAMPLE_RESOURCE_CLASSES[0].labels[0].value, { exact: false })).toBeTruthy();
    });
  },
};

export const OpensPopoverOnClick: Story = {
  name: 'Opens resource class picker popover on click',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the chip button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Class list is visible in the overlay', async () => {
      const overlay = document.querySelector('mat-selection-list');
      await expect(overlay).not.toBeNull();
    });
  },
};

export const ListsAllClasses: Story = {
  name: 'Lists all resource classes plus "All" option in popover',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click to open popover', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('"All resources" option is present', async () => {
      await expect(document.body.textContent).toContain('All resources');
    });
    await step('Each resource class is shown as an option', async () => {
      const options = document.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(SAMPLE_RESOURCE_CLASSES.length + 1);
    });
  },
};
