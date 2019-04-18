import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiViewerModule } from '@knora/viewer';
import { ResultsComponent } from './results.component';
import { KuiCoreModule, KuiCoreConfigToken, KuiCoreConfig } from '@knora/core';


describe('ResultsComponent', () => {
  let component: ResultsComponent;
  let fixture: ComponentFixture<ResultsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultsComponent ],
      imports: [
        KuiCoreModule,
        KuiViewerModule,
        RouterTestingModule
      ],
      providers: [
          {
              provide: KuiCoreConfigToken,
              useValue: KuiCoreConfig
          }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
