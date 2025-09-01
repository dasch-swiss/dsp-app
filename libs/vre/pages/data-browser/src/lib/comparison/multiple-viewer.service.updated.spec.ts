import { TestBed } from '@angular/core/testing';
import { ReadResource } from '@dasch-swiss/dsp-js';

import { MultipleViewerService } from './multiple-viewer.service';

describe('MultipleViewerService - Updated Version', () => {
  let service: MultipleViewerService;
  let mockResource1: ReadResource;
  let mockResource2: ReadResource;
  let mockResource3: ReadResource;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MultipleViewerService],
    });
    service = TestBed.inject(MultipleViewerService);

    // Create mock ReadResource objects
    mockResource1 = { id: 'resource-1' } as ReadResource;
    mockResource2 = { id: 'resource-2' } as ReadResource;
    mockResource3 = { id: 'resource-3' } as ReadResource;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should start with empty selection and selectMode false', () => {
      expect(service.selectMode).toBe(false);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([]);
    });
  });

  describe('addResources', () => {
    it('should add multiple resources and set selectMode to true', () => {
      const resourcesToAdd = [mockResource1, mockResource2];

      service.addResources(resourcesToAdd);

      expect(service.selectMode).toBe(true);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([mockResource1, mockResource2]);
    });

    it('should clear previous single selection when not in selectMode', () => {
      // Arrange: Start with single resource (selectMode false)
      service.selectOneResource(mockResource1);
      expect(service.selectMode).toBe(false);

      // Act: Add new resources
      service.addResources([mockResource2, mockResource3]);

      // Assert: Should clear previous selection and add new resources
      expect(service.selectMode).toBe(true);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([mockResource2, mockResource3]);
    });

    it('should not add duplicate resources', () => {
      // Add initial resources
      service.addResources([mockResource1, mockResource2]);

      // Try to add some duplicates
      service.addResources([mockResource2, mockResource3]);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([mockResource1, mockResource2, mockResource3]);
    });

    it('should handle empty array input', () => {
      service.addResources([]);

      expect(service.selectMode).toBe(true);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([]);
    });
  });

  describe('removeResources', () => {
    it('should remove multiple resources', () => {
      // Arrange: Start with three resources
      service.addResources([mockResource1, mockResource2, mockResource3]);

      // Act: Remove two resources
      service.removeResources([mockResource1, mockResource3]);

      // Assert: Should remove specified resources and stay in selectMode
      expect(service.selectMode).toBe(true);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([mockResource2]);
    });

    it('should set selectMode to false when all resources are removed', () => {
      // Arrange: Start with resources
      service.addResources([mockResource1, mockResource2]);
      expect(service.selectMode).toBe(true);

      // Act: Remove all resources
      service.removeResources([mockResource1, mockResource2]);

      // Assert: Should set selectMode to false
      expect(service.selectMode).toBe(false);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([]);
    });

    it('should handle removing non-existent resources gracefully', () => {
      // Arrange: Start with some resources
      service.addResources([mockResource1, mockResource2]);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      // Act: Try to remove a non-existent resource
      service.removeResources([mockResource3]);

      // Assert: Should not change the selection
      expect(selectedResources).toEqual([mockResource1, mockResource2]);
      expect(service.selectMode).toBe(true);
    });

    it('should handle empty array input', () => {
      // Arrange: Start with resources
      service.addResources([mockResource1, mockResource2]);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      // Act: Remove empty array
      service.removeResources([]);

      // Assert: Should not change anything
      expect(selectedResources).toEqual([mockResource1, mockResource2]);
      expect(service.selectMode).toBe(true);
    });
  });

  describe('selectOneResource', () => {
    it('should select single resource and set selectMode to false', () => {
      // Arrange: Start with multiple resources
      service.addResources([mockResource1, mockResource2]);
      expect(service.selectMode).toBe(true);

      // Act: Select one resource
      service.selectOneResource(mockResource3);

      // Assert: Should have only selected resource and selectMode false
      expect(service.selectMode).toBe(false);

      let selectedResources: ReadResource[] = [];
      service.selectedResources$.subscribe(resources => {
        selectedResources = resources;
      });

      expect(selectedResources).toEqual([mockResource3]);
    });
  });

  describe('Observable behavior', () => {
    it('should emit updates when resources change', () => {
      const emittedValues: ReadResource[][] = [];

      service.selectedResources$.subscribe(resources => {
        emittedValues.push([...resources]);
      });

      service.addResources([mockResource1]);
      service.addResources([mockResource2]);
      service.removeResources([mockResource1]);
      service.selectOneResource(mockResource3);

      expect(emittedValues).toEqual([
        [], // initial state
        [mockResource1],
        [mockResource1, mockResource2],
        [mockResource2],
        [mockResource3],
      ]);
    });
  });
});
