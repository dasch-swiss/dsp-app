import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
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
      imports: [IncomingResourceMoreMenuComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ResourceFetcherService, useValue: mockResourceFetcher },
        provideTranslateService(),
        TranslateService,
      ],
    })
      .overrideComponent(IncomingResourceMoreMenuComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          // This tests only the component logic, not UI integration
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

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

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

  it('should hide menu when user can neither edit nor delete', async () => {
    userCanEdit$.next(false);
    userCanDelete$.next(false);

    const shouldShow = await firstValueFrom((component as any).shouldShowMenu$);

    expect(shouldShow).toBe(false);
  });
});
