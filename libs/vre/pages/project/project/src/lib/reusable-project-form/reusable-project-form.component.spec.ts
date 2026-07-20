import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { TranslateService } from '@ngx-translate/core';
import { NEVER, Observable, Subject } from 'rxjs';
import { ReusableProjectFormComponent } from './reusable-project-form.component';

describe('ReusableProjectFormComponent - form build gating (DEV-6765)', () => {
  let fixture: ComponentFixture<ReusableProjectFormComponent>;
  let component: ReusableProjectFormComponent;

  const baseFormData = {
    shortname: 'test',
    longname: 'Test project',
    description: [{ language: 'en', value: 'A description' }],
    keywords: ['k'],
  };

  async function createComponent(allProjects$: Observable<unknown>) {
    await TestBed.configureTestingModule({
      imports: [ReusableProjectFormComponent],
      providers: [
        { provide: AllProjectsService, useValue: { allProjects$ } },
        { provide: TranslateService, useValue: { instant: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReusableProjectFormComponent);
    component = fixture.componentInstance;
  }

  it('builds the edit form immediately, without waiting on the all-projects fetch', async () => {
    // allProjects$ never emits, so a built form proves the edit path does not depend on that fetch.
    await createComponent(NEVER);
    component.formData = { ...baseFormData, shortcode: '0001' } as any; // existing project → shortcode disabled

    const emitted: unknown[] = [];
    component.afterFormInit.subscribe(form => emitted.push(form));

    component.ngOnInit();

    expect(component.form).toBeDefined();
    expect(emitted).toHaveLength(1);
  });

  it('waits for the all-projects fetch before building the create form', async () => {
    const allProjects$ = new Subject<any>();
    await createComponent(allProjects$);
    component.formData = { ...baseFormData, shortcode: '' } as any; // new project → shortcode enabled

    const emitted: unknown[] = [];
    component.afterFormInit.subscribe(form => emitted.push(form));

    component.ngOnInit();
    expect(component.form).toBeUndefined();
    expect(emitted).toHaveLength(0);

    allProjects$.next([{ shortcode: '0002' }]);
    expect(component.form).toBeDefined();
    expect(emitted).toHaveLength(1);
  });
});
