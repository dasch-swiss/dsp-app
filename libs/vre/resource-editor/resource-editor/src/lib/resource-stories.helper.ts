import { of } from 'rxjs';

export const DEFAULT_HAS_PERMISSIONS =
  'CR knora-base:ProjectAdmin|M knora-base:ProjectMember|V knora-base:KnownUser|RV knora-base:UnknownUser';

export const resourceFetcherServiceStub = (shortcode = '0001') => ({
  resource$: of(undefined),
  userCanEdit$: of(false),
  projectShortcode$: of(shortcode),
});
