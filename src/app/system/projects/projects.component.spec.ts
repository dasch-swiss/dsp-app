import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsComponent } from './projects.component';
import { KuiActionModule } from '@knora/action';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { MatIconModule, MatMenuModule, MatDialogModule } from '@angular/material';
import { KuiCoreModule, KuiCoreConfigToken, KuiCoreConfig } from '@knora/core';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProjectsComponent,
        ProjectsListComponent
      ],
      imports: [
        KuiActionModule,
        KuiCoreModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule
      ],
      providers: [
          {
              provide: KuiCoreConfigToken,
              useValue: KuiCoreConfig
          }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
