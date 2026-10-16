import { ResourceResultService } from './resource-result.service';

describe('ResourceResultService', () => {
  let service: ResourceResultService;

  beforeEach(() => {
    service = new ResourceResultService();
  });

  describe('refresh state (DEV-7466)', () => {
    /** A view's first load has nothing on screen to keep, and shows its own spinner instead. */
    it('DoesNotCountAViewsFirstLoadAsARefresh', () => {
      service.markLoading();

      expect(service.isRefreshing()).toBe(false);
    });

    it('CountsALoadOnceResultsAreOnScreenAsARefresh', () => {
      service.markLoading();
      service.markLoaded();

      service.markLoading();

      expect(service.isRefreshing()).toBe(true);
    });

    it('EndsTheRefreshWhenTheNewResultsArrive', () => {
      service.markLoaded();
      service.markLoading();

      service.markLoaded();

      expect(service.isRefreshing()).toBe(false);
    });

    /** The failure panel replaces the results, so there is nothing left to wait on. */
    it('EndsTheRefreshWhenTheLoadFails', () => {
      service.markLoaded();
      service.markLoading();

      service.markFailed();

      expect(service.isRefreshing()).toBe(false);
    });

    /** A view switch or a retry starts from nothing again: its first load is not a refresh. */
    it('TreatsTheNextLoadAsAFirstOneAfterAReset', () => {
      service.markLoaded();
      service.markLoading();

      service.resetLoading();
      service.markLoading();

      expect(service.isRefreshing()).toBe(false);
    });
  });
});
