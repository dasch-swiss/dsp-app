import { Component, OnInit, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatLineModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MockResource, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { ResourceListComponent } from './resource-list.component';
import { FilteredResources } from '../list-view.component';
import { ResourceService } from '../../../resource/services/resource.service';

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
 * test parent component to simulate integration of resource-list component.
 */
@Component({
    template: `
      <app-resource-list #resList [resources]="resources" [selectedResourceIdx]="selectedResourceIdx" (resourcesSelected)="emitSelectedResources($event)"></app-resource-list>`
})
class TestParentComponent implements OnInit {

    @ViewChild('resList') resourceListComponent: ResourceListComponent;

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

// used to replace the service used by the component to test
class TestResourceService {
    getResourcePath(iri: string): string {
        return 'ThisisAFakeIri';
    }
}

describe('ResourceListComponent', () => {
    let testHostComponent: TestParentComponent;
    let testHostFixture: ComponentFixture<TestParentComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                MockPipe,
                ResourceListComponent,
                TestParentComponent
            ],
            imports: [
                MatCheckboxModule,
                MatIconModule,
                MatLineModule,
                MatListModule
            ],
            providers: [{ provide: ResourceService, useClass: TestResourceService }]
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

    });

});
