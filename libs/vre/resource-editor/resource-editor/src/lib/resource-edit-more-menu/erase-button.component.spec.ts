import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CanDoResponse } from '@dasch-swiss/dsp-js';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { EraseButtonComponent } from './erase-button.component';

describe('EraseButtonComponent', () => {
  let component: EraseButtonComponent;
  let fixture: ComponentFixture<EraseButtonComponent>;

  const mockResource = {
    id: 'test-resource-id',
    type: 'test-type',
    lastModificationDate: '2023-01-01',
    incomingReferences: [],
    properties: {},
    userHasPermission: 'D',
  };

  const mockDialogRef = {
    afterClosed: jest.fn().mockReturnValue(of(false)),
  };

  const mockDialog = {
    open: jest.fn().mockReturnValue(mockDialogRef),
  };

  const mockViewContainerRef = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EraseButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: ViewContainerRef, useValue: mockViewContainerRef },
        provideTranslateService(),
        TranslateService,
      ],
    })
      .overrideComponent(EraseButtonComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EraseButtonComponent);
    component = fixture.componentInstance;
    component.resource = mockResource as any;

    const canDoResponse = new CanDoResponse();
    canDoResponse.canDo = true;
    component.resourceCanBeDeleted$ = new BehaviorSubject(canDoResponse);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('component initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have required inputs', () => {
      expect(component.resourceCanBeDeleted$).toBeDefined();
      expect(component.resource).toBeDefined();
    });
  });

  describe('erase functionality', () => {
    it('should open erase dialog when eraseResource is called', () => {
      component.eraseResource();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should emit erased when erase dialog returns true', done => {
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      jest.spyOn(component.erased, 'emit');

      component.eraseResource();

      setTimeout(() => {
        expect(component.erased.emit).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should not emit erased when erase dialog returns false', done => {
      mockDialogRef.afterClosed.mockReturnValue(of(false));
      jest.spyOn(component.erased, 'emit');

      component.eraseResource();

      setTimeout(() => {
        expect(component.erased.emit).not.toHaveBeenCalled();
        done();
      }, 10);
    });
  });
});
