import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ResourceFetcherService } from './representation/resource-fetcher.service';
import { ResourceFetcherComponent } from './resource-fetcher.component';

/**
 * DEV-7208: `outdatedVersion` is what the version banner binds to. It must stay undefined unless
 * the requested version is genuinely superseded — binding the raw `version` query param made the
 * banner appear on first render and then vanish once the resource arrived and the param was
 * purged, which is what every ARK to a never-modified resource produces.
 */
describe('ResourceFetcherComponent version banner', () => {
  let component: ResourceFetcherComponent;
  let fixture: ComponentFixture<ResourceFetcherComponent>;
  let resourceSubject: BehaviorSubject<DspResource | undefined>;
  let navigate: jest.Mock;

  const VERSION = '20110414T075804Z';

  const makeResource = (overrides: Partial<ReadResource> = {}): DspResource => {
    const res = new ReadResource();
    res.id = 'http://rdfh.ch/0803/0KCLgPG6XM6qGje-0BC8tA';
    res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#Resource';
    res.label = '(2)r';
    res.creationDate = '2011-04-14T07:58:04Z';
    Object.assign(res, overrides);
    return { res } as DspResource;
  };

  async function setup(version: string | null) {
    resourceSubject = new BehaviorSubject<DspResource | undefined>(undefined);
    navigate = jest.fn().mockResolvedValue(true);

    const queryParamMap = new Map<string, string>(version ? [['version', version]] : []);

    await TestBed.configureTestingModule({
      imports: [ResourceFetcherComponent],
      providers: [
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap } } },
        { provide: Router, useValue: { navigate } },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
      ],
    })
      .overrideComponent(ResourceFetcherComponent, {
        set: {
          // The real template pulls in the whole resource viewer; these assertions are about the
          // banner's data source, so render only what the banner binds to.
          template: '<span id="banner">{{ outdatedVersion }}</span>',
          imports: [],
          providers: [
            {
              provide: ResourceFetcherService,
              useValue: {
                resource$: resourceSubject.asObservable(),
                scrollToTop$: new Subject<void>().asObservable(),
                loadResource: jest.fn(),
              },
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceFetcherComponent);
    component = fixture.componentInstance;
    component.resourceIri = 'http://rdfh.ch/0803/0KCLgPG6XM6qGje-0BC8tA';
    fixture.detectChanges();
  }

  const bannerText = () => (fixture.nativeElement as HTMLElement).querySelector('#banner')!.textContent!.trim();

  it('never announces a version for a never-modified resource reached through a versioned ARK', async () => {
    await setup(VERSION);

    // Before the resource arrives the banner must already be empty — this is the flash.
    expect(component.outdatedVersion).toBeUndefined();
    expect(bannerText()).toBe('');

    resourceSubject.next(makeResource({ lastModificationDate: undefined }));

    expect(component.outdatedVersion).toBeUndefined();
    expect(bannerText()).toBe('');
    expect(navigate).toHaveBeenCalledWith([], { queryParams: { version: null }, queryParamsHandling: 'merge' });
  });

  it('announces the version when the resource has since been modified', async () => {
    await setup(VERSION);

    resourceSubject.next(makeResource({ lastModificationDate: '2024-03-15T10:30:00Z' }));

    expect(component.outdatedVersion).toBe(VERSION);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('announces nothing when the requested version is already the latest modification', async () => {
    await setup(VERSION);

    resourceSubject.next(makeResource({ lastModificationDate: '2011-04-14T07:58:04Z' }));

    expect(component.outdatedVersion).toBeUndefined();
    expect(navigate).toHaveBeenCalled();
  });

  it('announces nothing when no version was requested at all', async () => {
    await setup(null);

    resourceSubject.next(makeResource({ lastModificationDate: '2024-03-15T10:30:00Z' }));

    expect(component.outdatedVersion).toBeUndefined();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps announcing the requested version for a deleted resource', async () => {
    await setup(VERSION);

    resourceSubject.next(makeResource({ type: Constants.DeletedResource }));

    expect(component.outdatedVersion).toBe(VERSION);
  });
});
