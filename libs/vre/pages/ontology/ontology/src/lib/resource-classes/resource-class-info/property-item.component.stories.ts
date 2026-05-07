import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import {
  makeClassPropertyInfo,
  makeOntologyEditServiceStub,
  makeProjectPageServiceStub,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { PropertyItemComponent } from './property-item.component';

const classProp = makeClassPropertyInfo();

const meta: Meta<PropertyItemComponent> = {
  title: 'Ontology / Resource Classes / Property Item',
  component: PropertyItemComponent,
  argTypes: {
    classProp: {
      description: 'The class property info to display.',
      table: { type: { summary: 'ClassPropertyInfo' }, category: 'Inputs' },
    },
    cardinalityChange: {
      description: 'Emitted when cardinality is changed by the user.',
      table: { type: { summary: 'IHasProperty' }, category: 'Outputs' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyItemComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...TranslateModule.forRoot().providers!,
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
];

export const DefaultView: Story = {
  name: 'Shows property label and type icon',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: { classProp },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Property label is visible', async () => {
      await expect(canvas.getByTestId('property-label')).toBeInTheDocument();
    });
  },
};

export const ReadOnlyForNonAdmin: Story = {
  name: 'Hides edit controls when user has no admin rights',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders.slice(0, -2),
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ hasProjectAdminRights$: of(false) }) },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
  ],
  args: { classProp },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Property label is still visible', async () => {
      await expect(canvas.getByTestId('property-label')).toBeInTheDocument();
    });
  },
};
