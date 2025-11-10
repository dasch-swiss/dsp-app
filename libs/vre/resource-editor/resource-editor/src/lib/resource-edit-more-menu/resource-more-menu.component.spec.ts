import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { ResourceMoreMenuComponent } from './resource-more-menu.component';

describe('ResourceMoreMenuComponent', () => {
  let component: ResourceMoreMenuComponent;
  let fixture: ComponentFixture<ResourceMoreMenuComponent>;

  const mockResource = {
    id: 'test-resource-id',
    label: 'Test Resource',
    type: 'test-type',
  };

  const userCanDelete$ = new BehaviorSubject(true);
  const mockResourceFetcher = { userCanDelete$ };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourceMoreMenuComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: ResourceFetcherService, useValue: mockResourceFetcher }],
    })
      .overrideComponent(ResourceMoreMenuComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceMoreMenuComponent);
    component = fixture.componentInstance;
    component.resource = mockResource as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userCanDelete$.next(true);
  });

  describe('component initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have required resource input', () => {
      expect(component.resource).toBeDefined();
      expect(component.resource).toEqual(mockResource);
    });

    it('should have resourceDeleted output emitter', () => {
      expect(component.resourceDeleted).toBeDefined();
    });

    it('should have resourceErased output emitter', () => {
      expect(component.resourceErased).toBeDefined();
    });

    it('should have access to ResourceFetcherService', () => {
      expect((component as any).resourceFetcher).toBeDefined();
      expect((component as any).resourceFetcher).toBe(mockResourceFetcher);
    });
  });

  describe('menu visibility', () => {
    it('should show menu when user can delete', done => {
      userCanDelete$.next(true);

      fixture.detectChanges();

      // Subscribe to the userCanDelete$ observable
      mockResourceFetcher.userCanDelete$.subscribe(canDelete => {
        expect(canDelete).toBe(true);
        done();
      });
    });

    it('should hide menu when user cannot delete', done => {
      userCanDelete$.next(false);

      fixture.detectChanges();

      mockResourceFetcher.userCanDelete$.subscribe(canDelete => {
        expect(canDelete).toBe(false);
        done();
      });
    });
  });

  describe('event emitters', () => {
    it('should emit resourceDeleted when triggered', () => {
      const emitSpy = jest.spyOn(component.resourceDeleted, 'emit');

      component.resourceDeleted.emit();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit resourceErased when triggered', () => {
      const emitSpy = jest.spyOn(component.resourceErased, 'emit');

      component.resourceErased.emit();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
