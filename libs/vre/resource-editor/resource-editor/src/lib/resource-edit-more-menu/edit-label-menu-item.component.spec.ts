import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { EditLabelMenuItemComponent } from './edit-label-menu-item.component';

describe('EditLabelMenuItemComponent', () => {
  let component: EditLabelMenuItemComponent;
  let fixture: ComponentFixture<EditLabelMenuItemComponent>;

  const mockResource = {
    id: 'test-resource-id',
    label: 'Test Resource',
    type: 'test-type',
  };

  const mockDialogRef = {
    afterClosed: jest.fn().mockReturnValue(of(false)),
  };

  const mockDialog = {
    open: jest.fn().mockReturnValue(mockDialogRef),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditLabelMenuItemComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: ViewContainerRef, useValue: {} },
      ],
    })
      .overrideComponent(EditLabelMenuItemComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          // This tests only the component logic, not UI integration
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EditLabelMenuItemComponent);
    component = fixture.componentInstance;
    component.resource = mockResource as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should open edit label dialog with correct data', () => {
    component.editResourceLabel();

    expect(mockDialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: mockResource,
      })
    );
  });

  it('should emit resourceUpdated when dialog returns true', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));
    const emitSpy = jest.spyOn(component.resourceUpdated, 'emit');

    component.editResourceLabel();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should not emit resourceUpdated when dialog returns false', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(false));
    const emitSpy = jest.spyOn(component.resourceUpdated, 'emit');

    component.editResourceLabel();

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
