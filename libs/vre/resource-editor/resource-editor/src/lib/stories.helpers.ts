import { ReadIntervalValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { of, Subject } from 'rxjs';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { Segment } from './segment-support/segment';
import { SegmentsService } from './segment-support/segments.service';

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
