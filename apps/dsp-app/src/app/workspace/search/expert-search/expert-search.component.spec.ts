import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { TestConfig } from '@dsp-app/src/test.config';
import { SearchParams } from '../../results/list-view/list-view.component';
import { GravsearchSearchParams, SearchParamsService } from '../services/search-params.service';
import { ExpertSearchComponent } from './expert-search.component';

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-expert-search #expSearch (search)="gravsearchQuery($event)"></app-expert-search>`,
})
class TestHostComponent implements OnInit {
  @ViewChild('expSearch') expertSearch: ExpertSearchComponent;

  gravsearchQ: SearchParams;

  ngOnInit() {}

  gravsearchQuery(query: SearchParams) {
    this.gravsearchQ = query;
  }
}

describe('ExpertSearchComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;
  let hostCompDe: DebugElement;

  let searchParamsServiceSpy: jasmine.SpyObj<SearchParamsService>;
  let gravsearchSearchParams: GravsearchSearchParams;

  beforeEach(waitForAsync(() => {
    const spy = jasmine.createSpyObj('SearchParamsService', ['changeSearchParamsMsg']);

    TestBed.configureTestingModule({
      declarations: [ExpertSearchComponent, TestHostComponent],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        ReactiveFormsModule,
      ],
      providers: [
        AppConfigService,
        {
          provide: DspApiConfigToken,
          useValue: TestConfig.ApiConfig,
        },
        {
          provide: DspApiConnectionToken,
          useValue: new KnoraApiConnection(TestConfig.ApiConfig),
        },
        {
          provide: SearchParamsService,
          useValue: spy,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;

    searchParamsServiceSpy = TestBed.inject(SearchParamsService) as jasmine.SpyObj<SearchParamsService>;
    searchParamsServiceSpy.changeSearchParamsMsg.and.callFake((searchParams: GravsearchSearchParams) => {
      gravsearchSearchParams = searchParams;
    });

    testHostFixture.detectChanges();

    hostCompDe = testHostFixture.debugElement;
  });

  it('should create', () => {
    expect(testHostComponent).toBeTruthy();
    expect(testHostComponent.expertSearch).toBeTruthy();
  });

  it('should reset the form', () => {
    const resetBtn = hostCompDe.query(By.css('button.reset'));
    const textarea = hostCompDe.query(By.css('textarea.textarea-field-content'));

    const resetEle = resetBtn.nativeElement;
    const textareaEle = textarea.nativeElement;

    // mock enter some characters into textarea
    textareaEle.value = 'some text';

    resetEle.click();

    testHostFixture.detectChanges();

    // reset the textarea content
    expect(textareaEle.value).toBe('');
  });

  it('should not return an invalid query', () => {
    // if no query is entered
    expect(testHostComponent.expertSearch.expertSearchForm.valid).toBeFalsy();

    const textarea = hostCompDe.query(By.css('textarea.textarea-field-content'));
    const textareaEle = textarea.nativeElement;

    expect(textareaEle.value).toBe('');

    // mock enter a wrong gravsearch query into textarea: "OFFSET 0" is not allowed in the query.
    textareaEle.value = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX incunabula: <http://0.0.0.0:3333/ontology/0803/incunabula/v2#>

CONSTRUCT {
    ?book knora-api:isMainResource true .
    ?book incunabula:title ?title .

} WHERE {
    ?book a incunabula:book .
    ?book incunabula:title ?title .
}

OFFSET 0
`;

    textareaEle.dispatchEvent(new Event('input'));
    testHostFixture.detectChanges();

    expect(testHostComponent.expertSearch.expertSearchForm.valid).toBeFalsy();

    const submitForm = testHostComponent.expertSearch.submitQuery();

    expect(submitForm).toBeFalsy();
  });
});
