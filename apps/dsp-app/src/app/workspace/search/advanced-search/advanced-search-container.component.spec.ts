import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { MockProvider } from 'ng-mocks';
import { AdvancedSearchContainerComponent } from './advanced-search-container.component';

/**
 * test component to simulate select ontology component.
 */
@Component({
  selector: 'dasch-swiss-advanced-search',
  template: '',
})
class MockAdvancedSearchComponent {
  @Input() uuid: string;
}

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-advanced-search-container #advSearch></app-advanced-search-container>`,
})
class TestHostComponent implements OnInit {
  @ViewChild('advSearch') advancedSearch: AdvancedSearchContainerComponent;

  ngOnInit() {}
}

describe('AdvancedSearchContainerComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    const dspConnSpy = {
      v2: {
        onto: jasmine.createSpyObj('onto', ['getOntologiesMetadata']),
      },
    };

    TestBed.configureTestingModule({
      declarations: [AdvancedSearchContainerComponent, TestHostComponent, MockAdvancedSearchComponent],
      imports: [BrowserAnimationsModule],
      providers: [
        MockProvider(AppLoggingService),
        {
          provide: DspApiConnectionToken,
          useValue: dspConnSpy,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              snapshot: {
                url: [{ path: 'project' }],
                params: [{ uuid: '0123' }],
              },
            },
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();

    expect(testHostComponent).toBeTruthy();
  });

  it('should create an instance', () => {
    expect(testHostComponent.advancedSearch).toBeTruthy();
  });
});
