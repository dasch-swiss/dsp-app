import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';

import { SelectedResourcesComponent } from './selected-resources.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'app-selected-resources-host-component',
    template: `
      <app-selected-resources #selectedResources [resCount]="selectedResCount" [resIds]="selectedRes" (actionType)="getActionType($event)">
      </app-selected-resources>`
})
class TestHostSelectedResourcesComponent {

    @ViewChild('selectedResources') selectedResources: SelectedResourcesComponent;

    selectedResCount = 2;
    selectedRes = ['http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'http://rdfh.ch/0010/H6gBWUuJSuuO-CilddsgfdQw'];

    getActionType(action: string) {
        console.log(action);
    }
}

describe('SelectedResourcesComponent', () => {
    let testHostComponent: TestHostSelectedResourcesComponent;
    let testHostFixture: ComponentFixture<TestHostSelectedResourcesComponent>;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                SelectedResourcesComponent,
                TestHostSelectedResourcesComponent
            ],
            imports: [
                MatListModule,
                MatButtonModule,
                MatIconModule
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostSelectedResourcesComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent.selectedResources).toBeTruthy();
    });
});
