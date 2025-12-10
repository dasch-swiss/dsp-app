import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { CreateResourceDialogComponent, CreateResourceDialogProps } from './create-resource-dialog.component';

describe('CreateResourceDialogComponent', () => {
  let component: CreateResourceDialogComponent;
  let fixture: ComponentFixture<CreateResourceDialogComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<CreateResourceDialogComponent>>;

  const mockDialogData: CreateResourceDialogProps = {
    resourceType: 'Image',
    resourceClassIri: 'http://test.org/ontology#ImageResource',
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn(),
    } as any;

    const mockResourceFetcherService = {
      projectShortcode$: of('test'),
      projectIri$: of('http://test.org/project/123'),
    } as any;

    const mockProjectPageService = {
      currentProject$: of({ shortcode: 'test', id: 'http://test.org/project/123' }),
    } as any;

    await TestBed.configureTestingModule({
      imports: [CreateResourceDialogComponent, TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ResourceFetcherService, useValue: mockResourceFetcherService },
        { provide: ProjectPageService, useValue: mockProjectPageService },
        TranslateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateResourceDialogComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Dialog interactions', () => {
    it('should close dialog with resource IRI when resource is created', () => {
      const resourceIri = 'http://test.org/resource/456';

      component.onCreatedResource(resourceIri);

      expect(mockDialogRef.close).toHaveBeenCalledWith(resourceIri);
    });

    it('should close dialog without data when cancelled', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
