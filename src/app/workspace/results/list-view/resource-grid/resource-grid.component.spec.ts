import { Component, OnInit, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MockResource, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { ResourceGridComponent } from './resource-grid.component';
import { FilteredResources } from '../list-view.component';

/**
 * mocked truncate pipe from action module.
 */
@Pipe({ name: 'appTruncate' })
class MockPipe implements PipeTransform {
    transform(value: string, limit?: number, trail?: string): string {
        // do stuff here, if you want
        return value;
    }
}

/**
 * test parent component to simulate integration of resource-grid component.
 */
@Component({
    template: `
      <app-resource-grid #resGrid [resources]="resources" [selectedResourceIdx]="selectedResourceIdx" (resourcesSelected)="emitSelectedResources($event)"></app-resource-grid>`
})
class TestParentComponent implements OnInit {

    @ViewChild('resGrid') resourceGridComponent: ResourceGridComponent;

    resources: ReadResourceSequence;

    selectedResourceIdx = [0];

    selectedResources: FilteredResources;

    ngOnInit() {

        MockResource.getTestThings(5).subscribe(res => {
            this.resources = res;
        });
    }

    emitSelectedResources(resInfo: FilteredResources) {
        this.selectedResources = resInfo;
    }

}

describe('ResourceGridComponent', () => {
    let testHostComponent: TestParentComponent;
    let testHostFixture: ComponentFixture<TestParentComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                MockPipe,
                ResourceGridComponent,
                TestParentComponent
            ],
            imports: [
                MatCardModule,
                MatCheckboxModule
            ],
            providers: []
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestParentComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('expect 5 resources', () => {
        expect(testHostComponent.resources).toBeTruthy();
        expect(testHostComponent.resources.resources.length).toBe(5);
    });

    it('should open first resource', () => {
        // trigger the click
        const nativeElement = testHostFixture.nativeElement;
        const item = nativeElement.querySelector('div.link');
        item.dispatchEvent(new Event('click'));

        spyOn(testHostComponent, 'emitSelectedResources').call({ count: 1, resListIndex: [0], resIds: ['http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'], selectionType: 'single' });
        expect(testHostComponent.emitSelectedResources).toHaveBeenCalled();
        expect(testHostComponent.emitSelectedResources).toHaveBeenCalledTimes(1);

        // expect(testHostComponent.resIri).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw');
    });

});
