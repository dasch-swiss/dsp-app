import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, Input } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  CountQueryResponse,
  ReadResource,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';

import { ResourceFetcherService } from './representation/resource-fetcher.service';
import { ResourceDispatcherComponent } from './resource-dispatcher.component';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const PLAIN_RESOURCE_IRI = 'http://rdfh.ch/resource/plain-1';
const PLAIN_RESOURCE_TYPE = 'http://example.org/onto#PlainThing';

const makeEmptyEntityInfo = (resourceType: string): ResourceClassAndPropertyDefinitions => {
  const classStub = {
    label: 'Plain Thing',
    getResourcePropertiesList: () => [],
    propertiesList: [],
  } as unknown as ResourceClassDefinitionWithPropertyDefinition;
  return new ResourceClassAndPropertyDefinitions({ [resourceType]: classStub }, {});
};

// Builds a Plain (no file value, no Region/Segment) DspResource — exactly the type
// that routes through the dispatcher's async compound-count branch, which is where
// the destroy-on-reload bug used to live.
const makePlainResource = (label: string): DspResource => {
  const res = new ReadResource();
  res.id = PLAIN_RESOURCE_IRI;
  res.type = PLAIN_RESOURCE_TYPE;
  res.label = label;
  res.attachedToProject = 'http://rdfh.ch/projects/test';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = 'CR';
  res.properties = {};
  res.entityInfo = makeEmptyEntityInfo(res.type);

  const dsp = new DspResource(res);
  dsp.resProps = [];
  return dsp;
};

// ---------------------------------------------------------------------------
// Host component
//
// The point of this story is to assert that the dispatcher does NOT tear down
// the rendered subtree (<app-resource-plain> in our case) when the parent
// re-emits a fresh DspResource reference with the same id — the production
// path that ResourceFetcherService.reload() takes after a property edit.
//
// Storybook does not have a built-in "swap @Input mid-play" primitive, so we
// wrap the dispatcher in a tiny host that exposes a button which reassigns
// the resource @Input. The play() function clicks the button — the click
// runs inside Angular's NgZone so change detection picks up the new reference
// and the dispatcher's ngOnChanges fires, mirroring the production flow.
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-dispatcher-reload-host',
  template: `
    <button data-cy="story-reload-button" (click)="reloadWithSameId('Updated label')">Reload</button>
    <app-resource-dispatcher [resource]="resource" />
  `,
  imports: [ResourceDispatcherComponent],
})
class DispatcherReloadHostComponent {
  @Input() resource!: DspResource;

  reloadWithSameId(updatedLabel: string) {
    // Mimic ResourceFetcherService.reload(): emit a *new* DspResource reference
    // with the same id but mutated content. Same identity check, different object.
    this.resource = makePlainResource(updatedLabel);
  }
}

// ---------------------------------------------------------------------------
// Shared providers
// ---------------------------------------------------------------------------

const appConfigServiceStub = {
  dspApiConfig: { apiUrl: '' },
  dspAppConfig: { iriBase: 'http://rdfh.ch' },
};

const projectApiServiceStub = {
  get: () =>
    of({
      project: {
        id: 'http://rdfh.ch/projects/test',
        shortcode: '0000',
        shortname: 'test',
        longname: 'Test Project',
      },
    }),
};

// CountQueryResponse with 0 results → dispatcher classifies the resource as Plain
// (not Compound). The constant is exposed so the play() can verify the right
// branch is exercised.
const PLAIN_COUNT_RESPONSE: CountQueryResponse = { numberOfResults: 0 } as CountQueryResponse;

const sharedProviders = [
  importProvidersFrom(OverlayModule),
  provideRouter([{ path: '**', component: class {} }]),
  { provide: AppConfigService, useValue: appConfigServiceStub },
  { provide: ProjectApiService, useValue: projectApiServiceStub },
  { provide: UserApiService, useValue: { get: () => of({ user: { givenName: 'Jane', familyName: 'Doe' } }) } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  {
    provide: AdminAPIApiService,
    useValue: {
      getAdminProjectsIriProjectiri: () =>
        of({
          project: {
            id: 'http://rdfh.ch/projects/test',
            shortcode: '0000',
            shortname: 'test',
            longname: 'Test Project',
          },
        }),
      getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ licenses: [] }),
    },
  },
  // The ResourceFetcherService is provided by an ancestor in production. The
  // dispatcher itself does not inject it, but the subtree (ResourceHeader etc.)
  // does. A minimal stub keeps observable subscriptions happy without driving
  // any state changes.
  {
    provide: ResourceFetcherService,
    useValue: {
      userCanEdit$: of(false),
      userCanDelete$: of(false),
      attachedUser$: of({ givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' }),
      resource$: NEVER,
      scrollToTop$: NEVER,
    },
  },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        // dispatcher.ngOnChanges() calls this for resources without a file value
        // to disambiguate Plain from Compound. Returning 0 → Plain.
        search: {
          doSearchStillImageRepresentationsCount: () => of(PLAIN_COUNT_RESPONSE),
          doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }),
        },
        res: {
          canDeleteResource: () => of({ canDo: true }),
        },
        onto: { getOntology: () => of({}) },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<DispatcherReloadHostComponent> = {
  title: 'Resource Editor / Resource Dispatcher',
  component: DispatcherReloadHostComponent,
  decorators: [
    moduleMetadata({ imports: [DispatcherReloadHostComponent] }),
    applicationConfig({ providers: sharedProviders }),
  ],
};
export default meta;
type Story = StoryObj<DispatcherReloadHostComponent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const PreservesSubtreeOnSameIdReload: Story = {
  name: 'preserves the resource subtree when reloaded with the same id (no scroll-to-top)',
  args: { resource: makePlainResource('Initial label') },
  play: async ({ canvasElement, step }) => {
    await step('Plain resource subtree is rendered', async () => {
      await waitFor(
        () => {
          const subtreeRoot = canvasElement.querySelector('app-resource-plain');
          expect(subtreeRoot).not.toBeNull();
        },
        { timeout: 2000 }
      );
    });

    await step('Tag the rendered DOM node so survival can be asserted after reload', async () => {
      const subtreeRoot = canvasElement.querySelector('app-resource-plain');
      expect(subtreeRoot).not.toBeNull();
      subtreeRoot!.setAttribute('data-test-survives-reload', 'original');
    });

    await step('Simulate ResourceFetcherService.reload() — new DspResource, same id', async () => {
      // Click the host's reload button. The button click runs inside Angular's
      // NgZone, which propagates the new @Input reference and fires the
      // dispatcher's ngOnChanges with a previousValue carrying the same id —
      // the exact production path triggered by ResourceFetcherService.reload().
      const button = canvasElement.querySelector<HTMLButtonElement>('[data-cy="story-reload-button"]');
      expect(button).not.toBeNull();
      button!.click();
    });

    await step('Same DOM node is still present — subtree was NOT destroyed', async () => {
      await waitFor(
        () => {
          const survivor = canvasElement.querySelector('app-resource-plain[data-test-survives-reload="original"]');
          // If this assertion fails, the dispatcher destroyed and recreated the
          // subtree on same-id reload — a regression of the bug fixed in
          // resource-dispatcher.component.ts ngOnChanges. The user-visible
          // effect would be the page scrolling back to the top mid-edit.
          expect(survivor).not.toBeNull();
        },
        { timeout: 1000 }
      );
    });
  },
};
