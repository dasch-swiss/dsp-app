import { ProjectDataRightsService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { DataOverviewComponent } from './data-overview.component';
import { ProjectPageService } from './project-page.service';
import { makeProjectPageServiceStub, makeReadProject } from './stories.helpers';

const PROJECT = makeReadProject({
  shortcode: '0803',
  shortname: 'incunabula',
  longname: 'Bilderfolgen Basler Frühdrucke: Spätmittelalterliche Didaxe als Bild-Text-Lektüre',
  description: [
    {
      language: 'en',
      value:
        'The incunabula project studies the woodcut sequences of early Basel prints and how text and ' +
        'image were read together in late medieval didactic books.',
    },
  ],
});

// The panel next to the data sidebar at a 767 px window. Fixed here rather than via the viewport,
// because test-storybook runs every story at its default 1280 px viewport (DEV-7547).
const NARROW_PANEL_WIDTH = 560;

const meta: Meta<DataOverviewComponent> = {
  title: 'Pages / Project / Data Overview',
  component: DataOverviewComponent,
  decorators: [
    moduleMetadata({ imports: [DataOverviewComponent] }),
    applicationConfig({
      providers: [
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ currentProject$: of(PROJECT) }) },
        {
          provide: ProjectDataRightsService,
          useValue: {
            fromProject: () =>
              of({
                licenseLabel: 'CC BY 4.0',
                licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
                copyrightHolder: 'University of Basel',
                isPlaceholderLicense: false,
                isPlaceholderCopyrightHolder: false,
              }),
          },
        },
      ],
    }),
  ],
  argTypes: {},
};
export default meta;
type Story = StoryObj<DataOverviewComponent>;

export const FitsDescriptionCardInsideNarrowPanel: Story = {
  name: 'Shrinks the project description card to fit a narrow panel',
  render: () => ({
    template: `
      <div data-cy="panel" style="width: ${NARROW_PANEL_WIDTH}px">
        <app-data-overview />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByTestId('panel').getBoundingClientRect();
    const fitsPanel = (rect: DOMRect) => rect.left >= panel.left && rect.right <= panel.right;

    await step('Project title is shown', async () => {
      await expect(await canvas.findByRole('heading', { name: PROJECT.longname })).toBeInTheDocument();
    });
    await step('Card, cover image and title stay inside the panel', async () => {
      const card = canvasElement.querySelector('app-project-short-description');
      await expect(card).not.toBeNull();
      await expect(fitsPanel((card as HTMLElement).getBoundingClientRect())).toBe(true);
      await expect(fitsPanel(canvas.getByRole('img').getBoundingClientRect())).toBe(true);
      await expect(fitsPanel(canvas.getByRole('heading', { name: PROJECT.longname }).getBoundingClientRect())).toBe(
        true
      );
    });
  },
};
