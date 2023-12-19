import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';
import { TestConfig } from '@dsp-app/src/test.config';
import { StatusComponent } from '../main/status/status.component';
import { SystemComponent } from './system.component';

describe('SystemComponent', () => {
  let component: SystemComponent;
  let fixture: ComponentFixture<SystemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SystemComponent, StatusComponent],
      imports: [MatIconModule, MatTabsModule, RouterTestingModule],
      providers: [
        SessionService,
        {
          provide: DspApiConnectionToken,
          useValue: new KnoraApiConnection(TestConfig.ApiConfig),
        },
      ],
    }).compileComponents();
  }));

  // mock localStorage
  beforeEach(() => {
    let store = {};

    spyOn(localStorage, 'getItem').and.callFake(
      (key: string): string => store[key] || null
    );
    spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
      delete store[key];
    });
    spyOn(localStorage, 'setItem').and.callFake(
      (key: string, value: string): string => (store[key] = <any>value)
    );
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });
  });

  beforeEach(() => {
    localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

    fixture = TestBed.createComponent(SystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect<any>(localStorage.getItem('session')).toBe(
      JSON.stringify(TestConfig.CurrentSession)
    );
    expect(component).toBeTruthy();
  });

  // todo: check the title, check if there are 2 tabs
});
