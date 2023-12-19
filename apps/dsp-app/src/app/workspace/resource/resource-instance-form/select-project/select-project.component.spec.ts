import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockProjects, StoredProject } from '@dasch-swiss/dsp-js';
import { SelectProjectComponent } from './select-project.component';

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-select-project
    #selectProject
    [formGroup]="form"
    [usersProjects]="usersProjects"
    (projectSelected)="selectProjects($event)">
  </app-select-project>`,
})
class TestHostComponent implements OnInit {
  @ViewChild('selectProject') selectProject: SelectProjectComponent;

  form: UntypedFormGroup;
  usersProjects: StoredProject[] = [];
  selectedProjIri: string;

  constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

  ngOnInit() {
    this.usersProjects = MockProjects.mockProjects().body.projects;
    this.form = this._fb.group({});
  }

  selectProjects(projectIri: string) {
    this.selectedProjIri = projectIri;
  }
}

describe('SelectProjectComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;
  let loader: HarnessLoader;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SelectProjectComponent, TestHostComponent],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatSelectModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(testHostFixture);

    testHostFixture.detectChanges();
  });

  it('should create', () => {
    expect(testHostComponent).toBeTruthy();
    expect(testHostComponent.selectProject).toBeTruthy();
  });

  it('should add a new control to the parent form', waitForAsync(() => {
    // the control is added to the form as an async operation
    // https://angular.io/guide/testing#async-test-with-async
    testHostFixture.whenStable().then(() => {
      expect(testHostComponent.form.contains('projects')).toBe(true);
    });
  }));

  it('should initialise the projects', () => {
    expect(testHostComponent.selectProject.usersProjects).toBeDefined();
    expect(testHostComponent.selectProject.usersProjects.length).toEqual(6);
  });

  it('should init the MatSelect and MatOptions correctly', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    const initVal = await select.getValueText();

    // placeholder
    expect(initVal).toEqual('Select a project');

    await select.open();

    const options = await select.getOptions();

    expect(options.length).toEqual(6);

    const option1 = await options[0].getText();

    expect(option1).toEqual('00FF | images');

    const option2 = await options[1].getText();

    expect(option2).toEqual('0001 | anything');
  });

  it('should emit the Iri of a selected project', async () => {
    expect(testHostComponent.selectedProjIri).toBeUndefined();

    const select = await loader.getHarness(MatSelectHarness);

    await select.open();

    const options = await select.getOptions({ text: '0001 | anything' });

    expect(options.length).toEqual(1);

    await options[0].click();

    expect(testHostComponent.selectedProjIri).toEqual(
      'http://rdfh.ch/projects/0001'
    );
  });

  it('should unsubscribe from from changes on destruction', () => {
    expect(
      testHostComponent.selectProject.projectChangesSubscription.closed
    ).toBe(false);

    testHostFixture.destroy();

    expect(
      testHostComponent.selectProject.projectChangesSubscription.closed
    ).toBe(true);
  });
});
