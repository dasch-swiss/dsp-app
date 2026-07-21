import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateModule } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { EditProjectFormPageComponent } from './edit-project-form-page.component';
import { ReusableProjectFormComponent } from './reusable-project-form.component';

// Stub for the heavy form child so we can drive `afterFormInit` timing without its dependency tree.
@Component({ selector: 'app-reusable-project-form', standalone: true, template: '' })
class StubReusableProjectFormComponent {
  @Input() formData: unknown;
  @Output() afterFormInit = new EventEmitter<unknown>();
}

describe('EditProjectFormPageComponent - submit button render order (DEV-6746)', () => {
  let fixture: ComponentFixture<EditProjectFormPageComponent>;
  let currentProject$: ReplaySubject<any>;

  const project = {
    id: 'http://rdfh.ch/projects/0001',
    shortcode: '0001',
    shortname: 'test',
    longname: 'Test project',
    description: [{ language: 'en', value: 'A description' }],
    keywords: ['k'],
  };

  const submitButton = () => fixture.nativeElement.querySelector('[data-cy=submit-button]');
  const stub = () => fixture.debugElement.query(By.directive(StubReusableProjectFormComponent)).componentInstance;

  beforeEach(async () => {
    currentProject$ = new ReplaySubject<any>(1);

    await TestBed.configureTestingModule({
      imports: [EditProjectFormPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ProjectPageService, useValue: { currentProject$, reloadProject: jest.fn() } },
        { provide: ProjectApiService, useValue: { update: jest.fn() } },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
        { provide: LocalizationService, useValue: { currentLanguage: 'en' } },
      ],
    })
      .overrideComponent(EditProjectFormPageComponent, {
        remove: { imports: [ReusableProjectFormComponent] },
        add: { imports: [StubReusableProjectFormComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EditProjectFormPageComponent);
  });

  it('does not render the submit button before the project has loaded', () => {
    fixture.detectChanges();
    expect(submitButton()).toBeNull();
  });

  it('does not render the submit button after the project loads but before the form is built', () => {
    currentProject$.next(project);
    fixture.detectChanges();
    // The form child exists, but has not emitted afterFormInit yet, so `form` is still unset.
    expect(submitButton()).toBeNull();
  });

  it('renders the submit button once the form is built', () => {
    currentProject$.next(project);
    fixture.detectChanges();

    stub().afterFormInit.emit(new FormGroup({}));
    fixture.detectChanges();

    expect(submitButton()).not.toBeNull();
  });
});
