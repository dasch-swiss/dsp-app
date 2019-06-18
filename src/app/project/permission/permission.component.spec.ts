import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { Session } from '@knora/authentication';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { of } from 'rxjs';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { GroupsListComponent } from 'src/app/system/groups/groups-list/groups-list.component';
import { AddGroupComponent } from './add-group/add-group.component';
import { PermissionComponent } from './permission.component';


describe('PermissionComponent', () => {
  let component: PermissionComponent;
  let fixture: ComponentFixture<PermissionComponent>;

  const shortcode = '0001';

  const currentTestSession: Session = {
    id: 1555226377250,
    user: {
      jwt: '',
      lang: 'en',
      name: 'root',
      projectAdmin: [],
      sysAdmin: false
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PermissionComponent,
        AddGroupComponent,
        GroupsListComponent,
        ErrorComponent
      ],
      imports: [
        HttpClientTestingModule,
        KuiActionModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              paramMap: of({
                get: (param: string) => {
                  if (param === 'shortcode') {
                    return shortcode;
                  }
                }
              })
            }
          }
        },
        {
          provide: KuiCoreConfigToken,
          useValue: KuiCoreConfig
        }
      ]
    })
      .compileComponents();
  }));

  // mock localStorage
  beforeEach(() => {
    let store = {};

    spyOn(localStorage, 'getItem').and.callFake(
      (key: string): String => {
        return store[key] || null;
      }
    );
    spyOn(localStorage, 'removeItem').and.callFake(
      (key: string): void => {
        delete store[key];
      }
    );
    spyOn(localStorage, 'setItem').and.callFake(
      (key: string, value: string): string => {
        return (store[key] = <any>value);
      }
    );
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });
  });

  beforeEach(() => {
    localStorage.setItem('session', JSON.stringify(currentTestSession));

    fixture = TestBed.createComponent(PermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect<any>(localStorage.getItem('session')).toBe(
      JSON.stringify(currentTestSession)
    );
    expect(component).toBeTruthy();
  });
});
