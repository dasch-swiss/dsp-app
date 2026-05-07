import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { AnnotationTabComponent } from './annotation-tab.component';
import { RegionService } from '../../representation/region.service';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    attachedToProject: 'http://rdfh.ch/projects/test',
    attachedToUser: 'http://rdfh.ch/users/test',
    properties: {},
    entityInfo: { classes: {} },
  }) as any;

const meta: Meta<AnnotationTabComponent> = {
  title: 'Resource Editor / Resource / Annotation / Annotation Tab',
  component: AnnotationTabComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: RegionService,
          useValue: {
            regions$: of([]),
            selectedRegion$: of(null),
            highlightedRegionClicked$: of(null),
            selectRegion: () => {},
            scrollToTop: () => {},
            updateRegions$: () => of([]),
          },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The parent resource whose region annotations are listed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<AnnotationTabComponent>;

export const NoAnnotations: Story = {
  name: 'Shows empty annotation tab when resource has no regions',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Accordion container is rendered', async () => {
      const accordion = canvasElement.querySelector('mat-accordion');
      await expect(accordion).not.toBeNull();
    });
    await step('No annotation panels are rendered', async () => {
      const panels = canvasElement.querySelectorAll('[data-cy="annotation-border"]');
      await expect(panels.length).toBe(0);
    });
  },
};
