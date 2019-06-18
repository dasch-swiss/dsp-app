import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatIconModule, MatListModule, MatMenuModule } from '@angular/material';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { InfoMenuComponent } from './info-menu.component';


describe('InfoMenuComponent', () => {
  let component: InfoMenuComponent;
  let fixture: ComponentFixture<InfoMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InfoMenuComponent],
      imports: [
        HttpClientTestingModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatMenuModule
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
    fixture = TestBed.createComponent(InfoMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
