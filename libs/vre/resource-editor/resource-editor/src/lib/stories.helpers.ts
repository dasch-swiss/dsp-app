import { ReadIntervalValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { of, Subject } from 'rxjs';

import { RepresentationService } from './representation/representation.service';
import { ResourceFetcherService } from './representation/resource-fetcher.service';
import { Segment } from './representation/segments/segment';
import { SegmentsService } from './representation/segments/segments.service';

export const notificationServiceStub: Partial<NotificationService> = {
  openSnackBar: () => {},
};

export const representationServiceStub: Partial<RepresentationService> = {
  getFileInfo: () => of({ originalFilename: 'file' } as any),
  downloadProjectFile: () => {},
  getIngestOriginalUrl: () => of(''),
};

export const appConfigServiceStub = {
  dspApiConfig: { apiUrl: '' },
  dspAppConfig: { iriBase: 'http://rdfh.ch' },
};

export const projectApiServiceStub = {
  get: () =>
    of({
      project: {
        id: 'http://rdfh.ch/projects/0001',
        shortcode: '0001',
        shortname: 'test-project',
        longname: 'Test Project',
      },
    }),
};

export function makeResourceFetcherServiceStub(options?: {
  userCanEdit?: boolean;
  userCanDelete?: boolean;
  projectShortcode?: string;
  attachedUser?: { givenName: string; familyName: string; username: string };
}): Partial<ResourceFetcherService> {
  return {
    userCanEdit$: of(options?.userCanEdit ?? false),
    userCanDelete$: of(options?.userCanDelete ?? false),
    projectShortcode$: of(options?.projectShortcode ?? '0001'),
    ...(options?.attachedUser !== undefined && { attachedUser$: of(options.attachedUser as any) }),
    reload: () => {},
    scrollToTop: () => {},
  };
}

export function makeSegment(label: string, start: number, end: number, row: number): Segment {
  return {
    label,
    row,
    hasSegmentBounds: { start, end } as unknown as ReadIntervalValue,
    hasSegmentOfValue: undefined,
    hasComment: undefined,
    hasDescription: undefined,
    hasKeyword: undefined,
    hasTitle: undefined,
    resource: {} as any,
  } as Segment;
}

export function makeSegmentsServiceStub(segments: Segment[] = []): Partial<SegmentsService> {
  return {
    segments,
    onInit: () => {},
    setSegments: () => {},
    playSegment$: new Subject<any>().asObservable(),
    highlightSegment$: new Subject<any>().asObservable(),
  };
}

/**
 * Same-origin media URLs for stories.
 *
 * Stories must never point at a remote host. Pixeleye captures a story only once
 * the page reaches `networkidle` — 500ms with zero requests in flight — so a story
 * streaming a real file from iiif.stage.dasch.swiss, iiif.dev.dasch.swiss or
 * soundhelix.com never settles: the capture times out after 30s, exhausts its
 * retries and aborts the whole visual-regression build (DEV-7238). Remote media
 * also makes a snapshot depend on dev/stage uptime, which a baseline cannot.
 *
 * These paths are served by Storybook from `apps/dsp-app/cypress/uploads` (see the
 * `staticDirs` entry in `.storybook/main.ts`), reusing the media fixtures the
 * Cypress suite already commits rather than adding new binaries.
 */
export const STORY_AUDIO_URL = '/storybook-media/dasch-short.mp3';
export const STORY_VIDEO_URL = '/storybook-media/dasch-short.mp4';
export const STORY_IMAGE_URL = '/storybook-media/Fingerprint_Logo.jpg';

/**
 * IIIF base for the still-image stories.
 *
 * OpenSeadragon derives tile URLs from this base; nothing serves them, so every
 * tile request 404s immediately and the viewer renders empty. That is deliberate —
 * a static directory cannot answer the arbitrary region/size tile URLs OSD asks
 * for, and an unreachable-but-instant base keeps the page settling fast and the
 * snapshot deterministic. Only the surrounding chrome is under visual regression
 * for these stories, not the tiles.
 */
export const STORY_IIIF_BASE_URL = '/storybook-media/iiif';

/**
 * URL for the external-IIIF story.
 *
 * Absolute — the component parses it with `IIIFUrl.createUrl`, which needs a real
 * URL — but same-origin, so the `info.json` fetch 404s at once and the component
 * renders its documented "could not fetch info.json" state instead of hanging on a
 * third-party IIIF server.
 */
export const STORY_EXTERNAL_IIIF_URL = `${
  typeof window === 'undefined' ? 'http://localhost' : window.location.origin
}/storybook-media/iiif/external/full/max/0/default.jpg`;

/** Same-origin SVG for the vector-image stories, served from `apps/dsp-app/src/assets`. */
export const STORY_VECTOR_IMAGE_URL = '/assets/images/dasch-icon-black.svg';
