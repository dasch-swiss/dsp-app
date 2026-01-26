import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { provideTranslateService } from '@ngx-translate/core';
import { ReplaceFileMenuItemComponent } from './replace-file-menu-item.component';

describe('ReplaceFileMenuItemComponent', () => {
  let component: ReplaceFileMenuItemComponent;
  let fixture: ComponentFixture<ReplaceFileMenuItemComponent>;
  let dialogMock: jest.Mocked<Partial<MatDialog>>;
  let viewContainerRefMock: jest.Mocked<Partial<ViewContainerRef>>;

  const mockParentResource: ReadResource = {
    id: 'http://rdf.dasch.swiss/0001/test-resource',
    type: 'http://www.knora.org/ontology/knora-api/v2#Resource',
    label: 'Test Resource',
  } as ReadResource;

  const mockDialogConfig = {
    title: 'Archive',
    representation: Constants.HasArchiveFileValue,
  };

  beforeEach(async () => {
    dialogMock = {
      open: jest.fn(),
    };

    viewContainerRefMock = {} as any;

    await TestBed.configureTestingModule({
      imports: [ReplaceFileMenuItemComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService(), { provide: MatDialog, useValue: dialogMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplaceFileMenuItemComponent);
    component = fixture.componentInstance;
    component.dialogConfig = mockDialogConfig;
    component.parentResource = mockParentResource;
    component.viewContainerRef = viewContainerRefMock as ViewContainerRef;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openReplaceFileDialog', () => {
    it('should open replace file dialog with correct configuration', () => {
      const expectedConfig = {
        ...DspDialogConfig.mediumDialog({
          title: mockDialogConfig.title,
          representation: mockDialogConfig.representation,
          resource: mockParentResource,
        }),
        viewContainerRef: viewContainerRefMock,
      };

      component.openReplaceFileDialog();

      expect(dialogMock.open).toHaveBeenCalledWith(expect.anything(), expectedConfig);
    });

    it('should use viewContainerRef from input', () => {
      component.openReplaceFileDialog();

      const callArgs = (dialogMock.open as jest.Mock).mock.calls[0][1];
      expect(callArgs.viewContainerRef).toBe(viewContainerRefMock);
    });

    it('should use dialogConfig title and representation', () => {
      component.openReplaceFileDialog();

      expect(dialogMock.open).toHaveBeenCalled();
    });
  });
});
