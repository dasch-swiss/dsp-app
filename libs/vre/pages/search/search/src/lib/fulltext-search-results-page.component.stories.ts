import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, waitFor } from 'storybook/test';
import { FulltextSearchResultsPageComponent } from './fulltext-search-results-page.component';

const doFulltextSearch = fn(() => of({ resources: [] }));

const meta: Meta<FulltextSearchResultsPageComponent> = {
  title: 'Search / Fulltext Search / Fulltext Search Results Page',
  component: FulltextSearchResultsPageComponent,
  argTypes: {},
  beforeEach: () => {
    doFulltextSearch.mockClear();
  },
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        importProvidersFrom(OverlayModule),
        // The page reads the search term from the `q` route parameter.
        { provide: ActivatedRoute, useValue: { params: of({ q: 'hamlet' }) } },
        { provide: UserService, useValue: { currentUser: null } as Partial<UserService> },
        { provide: ResourceResultService, useValue: { pageIndex$: of(0), numberOfResults: 0 } },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: { search: { doFulltextSearch, doFulltextSearchCountQuery: () => of({ numberOfResults: 0 }) } },
          },
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<FulltextSearchResultsPageComponent>;

export const SearchesForRouteQuery: Story = {
  name: 'Runs a full-text search for the term in the URL',
  play: async ({ canvasElement, step }) => {
    await step('The search runs with the term from the route', async () => {
      await waitFor(() => expect(doFulltextSearch).toHaveBeenCalled());
      await expect(doFulltextSearch.mock.calls[0]).toContain('hamlet');
    });
    await step('The search result renders (empty here)', async () => {
      await expect(canvasElement.querySelector('app-search-result')).not.toBeNull();
      await expect(canvasElement.querySelector('app-no-results-found')).not.toBeNull();
    });
  },
};
