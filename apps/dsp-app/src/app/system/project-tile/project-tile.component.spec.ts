import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';

import { ProjectTileComponent } from './project-tile.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-project-tile
        #projectTile
        [project]="project"
        [sysAdmin]="sysAdmin"
    ></app-project-tile>`,
})
class TestHostProjectTileComponent implements OnInit {
    @ViewChild('projectTile') projectTileComp: ProjectTileComponent;

    project = new StoredProject();
    sysAdmin = true;

    ngOnInit() {
        this.project.status = true;
        this.project.longname = 'test project';
        this.project.id = 'http://rdfh.ch/projects/0123';
    }

    deactivateProject() {
        this.project.status = false;
    }

    activateProject() {
        this.project.status = true;
    }

    revokeSysAdminRole() {
        this.sysAdmin = false;
    }

    grantSysAdminRole() {
        this.sysAdmin = true;
    }
}

describe('ProjectTileComponent', () => {
    let testHostComponent: TestHostProjectTileComponent;
    let testHostFixture: ComponentFixture<TestHostProjectTileComponent>;
    let rootLoader: HarnessLoader;

    beforeEach(async () => {
        const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
            'iriToUuid',
        ]);

        await TestBed.configureTestingModule({
            declarations: [ProjectTileComponent, TestHostProjectTileComponent],
            imports: [MatButtonModule, MatIconModule, RouterTestingModule],
            providers: [
                {
                    provide: ProjectService,
                    useValue: projectServiceSpy,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostProjectTileComponent);
        testHostComponent = testHostFixture.componentInstance;
        rootLoader =
            TestbedHarnessEnvironment.documentRootLoader(testHostFixture);
        testHostFixture.detectChanges();

        // ensure host component was created
        expect(testHostComponent).toBeTruthy();

        // reset project status to true (active)
        testHostComponent.activateProject();

        // reset sysAdmin status to true
        testHostComponent.grantSysAdminRole();

        testHostFixture.detectChanges();

        const projectServiceSpy = TestBed.inject(ProjectService);

        (
            projectServiceSpy as jasmine.SpyObj<ProjectService>
        ).iriToUuid.and.callFake((iri: string) => '0123');
    });

    it('should show correct project status', () => {
        const hostCompDe = testHostFixture.debugElement;

        let activeStatus = hostCompDe.query(By.css('.status-badge.active'));
        let deactivatedStatus = hostCompDe.query(
            By.css('.status-badge.deactivated')
        );

        // active status should be shown
        expect(activeStatus).toBeTruthy();

        // deactivated status should NOT be shown
        expect(deactivatedStatus).toBeFalsy();

        // deactivate project
        testHostComponent.deactivateProject();

        testHostFixture.detectChanges();

        activeStatus = hostCompDe.query(By.css('.status-badge.active'));
        deactivatedStatus = hostCompDe.query(
            By.css('.status-badge.deactivated')
        );

        // active status should NOT be shown
        expect(activeStatus).toBeFalsy();

        // deactivated status should be shown
        expect(deactivatedStatus).toBeTruthy();
    });

    it('should show the project long name', () => {
        const hostCompDe = testHostFixture.debugElement;

        const projectName = hostCompDe.query(By.css('.title p'));
        expect(projectName.nativeElement.innerText).toEqual('test project');
    });

    it('should show settings button if user is a system admin', async () => {
        // grab the 'settings' button
        const settingsBtn = await rootLoader.getHarness(
            MatButtonHarness.with({ selector: '.settings-button' })
        );

        expect(settingsBtn).toBeTruthy();
    });

    it('should hide settings button if user is NOT a system admin', async () => {
        // set sysAdmin to false
        testHostComponent.revokeSysAdminRole();

        testHostFixture.detectChanges();

        // attempt to grab the 'settings' button
        const settingsBtn = await rootLoader.getAllHarnesses(
            MatButtonHarness.with({ selector: '.settings-button' })
        );

        // settings button should not be found by above method
        expect(settingsBtn.length).toEqual(0);
    });

    it('should go to project workspace when the "Go to dashboard" button is clicked', async () => {
        // spy on navigateTo method
        const navigateToSpy = spyOn(
            testHostComponent.projectTileComp,
            'navigateTo'
        );

        // grab the 'go to dashboard' button
        const goToProjectDashboardBtn = await rootLoader.getHarness(
            MatButtonHarness.with({ selector: '.workspace-button' })
        );

        // click the button
        await goToProjectDashboardBtn.click();

        // ensure the correct arguments were passed to the navigateTo method
        expect(navigateToSpy).toHaveBeenCalledWith(
            'http://rdfh.ch/projects/0123',
            'workspace'
        );
    });

    it('should go to project settings when the settings button is clicked', async () => {
        // spy on navigateTo method
        const navigateToSpy = spyOn(
            testHostComponent.projectTileComp,
            'navigateTo'
        );

        // grab the 'settings' button
        const settingsBtn = await rootLoader.getHarness(
            MatButtonHarness.with({ selector: '.settings-button' })
        );

        // click the button
        await settingsBtn.click();

        // ensure the correct arguments were passed to the navigateTo method
        expect(navigateToSpy).toHaveBeenCalledWith(
            'http://rdfh.ch/projects/0123',
            'settings'
        );
    });
});
