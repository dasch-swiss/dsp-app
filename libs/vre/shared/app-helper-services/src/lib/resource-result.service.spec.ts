import { ResourceResultService } from './resource-result.service';

describe('ResourceResultService', () => {
  let service: ResourceResultService;

  beforeEach(() => {
    service = new ResourceResultService();
  });

  describe('refresh state (DEV-7466)', () => {
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

    it('EndsTheRefreshWhenTheLoadFails', () => {
      service.markLoaded();
      service.markLoading();

      service.markFailed();

      expect(service.isRefreshing()).toBe(false);
    });

    it('TreatsTheNextLoadAsAFirstOneAfterAReset', () => {
      service.markLoaded();
      service.markLoading();

      service.resetLoading();
      service.markLoading();

      expect(service.isRefreshing()).toBe(false);
    });
  });
});
