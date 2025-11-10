import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { IncomingResourceMoreMenuComponent } from './incoming-resource-more-menu.component';

describe('IncomingResourceMoreMenuComponent', () => {
  let component: IncomingResourceMoreMenuComponent;
  let fixture: ComponentFixture<IncomingResourceMoreMenuComponent>;

  const mockResource = {
    id: 'test-resource-id',
    label: 'Test Resource',
    type: 'test-type',
  };

  const userCanEdit$ = new BehaviorSubject(true);
  const userCanDelete$ = new BehaviorSubject(true);
  const mockResourceFetcher = { userCanEdit$, userCanDelete$ };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IncomingResourceMoreMenuComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: ResourceFetcherService, useValue: mockResourceFetcher }],
    })
      .overrideComponent(IncomingResourceMoreMenuComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(IncomingResourceMoreMenuComponent);
    component = fixture.componentInstance;
    component.resource = mockResource as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userCanEdit$.next(true);
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

    it('should have resourceUpdated output emitter', () => {
      expect(component.resourceUpdated).toBeDefined();
    });

    it('should have access to ResourceFetcherService', () => {
      expect((component as any).resourceFetcher).toBeDefined();
      expect((component as any).resourceFetcher).toBe(mockResourceFetcher);
    });
  });

  describe('menu visibility logic', () => {
    it('should show menu when user can edit', async () => {
      userCanEdit$.next(true);
      userCanDelete$.next(false);

      const shouldShow = await firstValueFrom((component as any).shouldShowMenu$);

      expect(shouldShow).toBe(true);
    });

    it('should show menu when user can delete', async () => {
      userCanEdit$.next(false);
      userCanDelete$.next(true);

      const shouldShow = await firstValueFrom((component as any).shouldShowMenu$);

      expect(shouldShow).toBe(true);
    });

    it('should show menu when user can both edit and delete', async () => {
      userCanEdit$.next(true);
      userCanDelete$.next(true);

      const shouldShow = await firstValueFrom((component as any).shouldShowMenu$);

      expect(shouldShow).toBe(true);
    });

    it('should hide menu when user can neither edit nor delete', async () => {
      userCanEdit$.next(false);
      userCanDelete$.next(false);

      const shouldShow = await firstValueFrom((component as any).shouldShowMenu$);

      expect(shouldShow).toBe(false);
    });
  });

  describe('permission changes', () => {
    it('should react to changes in edit permission', done => {
      userCanEdit$.next(true);
      userCanDelete$.next(false);

      let emissionCount = 0;
      (component as any).shouldShowMenu$.subscribe((shouldShow: boolean) => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(shouldShow).toBe(true);
          // Change permission
          userCanEdit$.next(false);
        } else if (emissionCount === 2) {
          expect(shouldShow).toBe(false);
          done();
        }
      });
    });

    it('should react to changes in delete permission', done => {
      userCanEdit$.next(false);
      userCanDelete$.next(true);

      let emissionCount = 0;
      (component as any).shouldShowMenu$.subscribe((shouldShow: boolean) => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(shouldShow).toBe(true);
          // Change permission
          userCanDelete$.next(false);
        } else if (emissionCount === 2) {
          expect(shouldShow).toBe(false);
          done();
        }
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

    it('should emit resourceUpdated when triggered', () => {
      const emitSpy = jest.spyOn(component.resourceUpdated, 'emit');

      component.resourceUpdated.emit();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
