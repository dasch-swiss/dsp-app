import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CreateResourceFormComponent } from './create-resource-form.component';

describe('CreateResourceFormComponent', () => {
  let component: CreateResourceFormComponent;
  let fixture: ComponentFixture<CreateResourceFormComponent>;
  let mockDspApiConnection: jest.Mocked<KnoraApiConnection>;

  beforeEach(async () => {
    mockDspApiConnection = {
      v2: {
        ontologyCache: {
          reloadCachedItem: jest.fn().mockReturnValue(of({})),
          getResourceClassDefinition: jest.fn().mockReturnValue(
            of({
              classes: {
                'http://test.org/TestClass': {
                  id: 'http://test.org/TestClass',
                  getResourcePropertiesList: jest.fn().mockReturnValue([]),
                },
              },
              properties: {},
            })
          ),
        },
        res: {
          createResource: jest.fn().mockReturnValue(of({ id: 'http://test.org/resource/123' })),
        },
      },
    } as any;

    await TestBed.configureTestingModule({
      imports: [CreateResourceFormComponent, TranslateModule.forRoot(), ReactiveFormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [FormBuilder, { provide: DspApiConnectionToken, useValue: mockDspApiConnection }],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateResourceFormComponent);
    component = fixture.componentInstance;
    component.resourceClassIri = 'http://test.org/TestClass';
    component.projectIri = 'http://test.org/project/123';
    component.projectShortcode = 'test';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Cancel button interaction', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit cancelled event when cancel button is clicked', () => {
      const cancelledSpy = jest.fn();
      component.cancelled.subscribe(cancelledSpy);
      const cancelButton = fixture.nativeElement.querySelector('[data-cy="cancel-button"]');

      cancelButton.click();

      expect(cancelledSpy).toHaveBeenCalledTimes(1);
    });

    it('should prevent form submission with type="button"', () => {
      const cancelButton = fixture.nativeElement.querySelector('[data-cy="cancel-button"]');

      expect(cancelButton.getAttribute('type')).toBe('button');
    });
  });

  describe('submitData', () => {
    it('should not submit if form is invalid', () => {
      component.ngOnInit();
      fixture.detectChanges();

      component.form.controls.label.setValue('');
      component.submitData();

      expect(mockDspApiConnection.v2.res.createResource).not.toHaveBeenCalled();
    });
  });
});
