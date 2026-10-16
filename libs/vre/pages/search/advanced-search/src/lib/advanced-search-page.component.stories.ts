import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { AdvancedSearchPageComponent } from './advanced-search-page.component';
import { makeDspApiConnectionStub, STORY_PROVIDERS } from './stories.helpers';

// The page provides the real advanced-search services itself (component-level `provideAdvancedSearch()`),
// so app-level stubs cannot replace them: the page runs its real pipeline against the stubbed API.
const meta: Meta<AdvancedSearchPageComponent> = {
  title: 'Search / Advanced Search / Advanced Search Page',
  component: AdvancedSearchPageComponent,
  argTypes: {},
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        {
          provide: ProjectPageService,
          useValue: { currentProjectUuid: '0001', currentProject: { id: 'http://rdfh.ch/projects/0001' } },
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<AdvancedSearchPageComponent>;

// The stubbed API returns no ontologies, so this is a project without a data model.
export const ShowsSearchTipsBeforeSearching: Story = {
  name: 'Shows the no-data-model notice and search tips when no search is set',
  play: async ({ canvasElement, step }) => {
    await step('Search bar explains that the project has no data model', async () => {
      await waitFor(() => expect(canvasElement.querySelector('app-advanced-search-bar .no-data-model')).not.toBeNull());
    });
    await step('Search tips are shown instead of results', async () => {
      await expect(canvasElement.querySelector('app-search-tips')).not.toBeNull();
      await expect(canvasElement.querySelector('app-advanced-search-results')).toBeNull();
    });
  },
};
