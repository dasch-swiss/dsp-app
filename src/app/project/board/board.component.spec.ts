import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardComponent } from './board.component';
import { KuiActionModule } from '@knora/action';
import { MatIconModule, MatChipsModule, MatDialogModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiCoreModule, KuiCoreConfigToken, KuiCoreConfig } from '@knora/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { of } from 'rxjs';

// TODO: fix test
// TypeError: Cannot read property 'snapshot' of undefined
xdescribe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoardComponent ],
      imports: [
        KuiActionModule,
        KuiCoreModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        RouterTestingModule
      ],
      providers: [
        {
            provide: KuiCoreConfigToken,
            useValue: KuiCoreConfig
        },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ shortcode: '0001' })
          }
      }
    ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
