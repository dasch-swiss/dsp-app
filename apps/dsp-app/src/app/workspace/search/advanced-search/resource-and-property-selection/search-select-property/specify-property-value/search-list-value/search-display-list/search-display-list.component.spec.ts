import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchDisplayListComponent } from './search-display-list.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ListNodeV2, MockList } from '@dasch-swiss/dsp-js';
import { ReactiveFormsModule } from '@angular/forms';
import { HarnessLoader } from '@angular/cdk/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatLegacyMenuItemHarness as MatMenuItemHarness } from '@angular/material/legacy-menu/testing';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <button
            mat-menu-item
            [matMenuTriggerFor]="menu.childMenu"
            type="button"
            class="menubutton"
        >
            {{ child.label }}
        </button>
        <app-search-display-list
            #menu
            [children]="child.children"
            (selectedNode)="getSelectedNode($event)"
        >
        </app-search-display-list>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('menu')
    public searchDisplayListComponent: SearchDisplayListComponent;

    child: ListNodeV2;
    selectedNode: ListNodeV2;

    constructor() {}

    ngOnInit() {
        this.child = MockList.mockList('http://rdfh.ch/lists/0001/treeList');
    }

    getSelectedNode(node: ListNodeV2) {
        this.selectedNode = node;
    }
}

describe('SearchDisplayListComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatMenuModule,
            ],
            declarations: [SearchDisplayListComponent, TestHostComponent],
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
        expect(testHostComponent.searchDisplayListComponent).toBeTruthy();
    });

    it('should pass the children via the @Input', () => {
        expect(
            testHostComponent.searchDisplayListComponent.children.length
        ).toEqual(3);
    });

    it('should display the children and emit the selected node', async () => {
        const menuItemButton = await loader.getHarness(
            MatMenuItemHarness.with({ selector: '.menubutton' })
        );

        await menuItemButton.click();

        const subMenu = await menuItemButton.getSubmenu();

        const subMenuItems = await subMenu.getItems();

        expect(subMenuItems.length).toEqual(3);

        expect(await subMenuItems[0].hasSubmenu()).toBe(false);

        expect(await subMenuItems[1].hasSubmenu()).toBe(false);

        expect(await subMenuItems[2].hasSubmenu()).toBe(true);

        const subSubMenu = await subMenuItems[2].getSubmenu();

        expect(await subSubMenu.getTriggerText()).toEqual('Tree list node 03');

        await subMenuItems[0].click();

        expect(testHostComponent.selectedNode).toBeDefined();
        expect(testHostComponent.selectedNode.id).toEqual(
            'http://rdfh.ch/lists/0001/treeList01'
        );
    });
});
