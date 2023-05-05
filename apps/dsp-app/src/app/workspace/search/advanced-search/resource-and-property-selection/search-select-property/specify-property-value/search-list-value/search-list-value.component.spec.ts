import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import {
    MatLegacyMenu as MatMenu,
    MatLegacyMenuModule as MatMenuModule,
} from '@angular/material/legacy-menu';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ListNodeV2,
    ListsEndpointV2,
    MockList,
    MockOntology,
    ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { IRI } from '../operator';
import { SearchListValueComponent } from './search-list-value.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-search-list-value
        #listVal
        [formGroup]="form"
        [property]="property"
    ></app-search-list-value>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('listVal', { static: false })
    listValue: SearchListValueComponent;

    form;

    property: ResourcePropertyDefinition;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({});

        const anythingOnto = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        );
        this.property = anythingOnto.properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem'
        ] as ResourcePropertyDefinition;
    }
}

/**
 * test component to simulate date value component.
 */
@Component({
    selector: 'app-search-display-list',
    template:
        '<mat-menu #childMenu="matMenu" [overlapTrigger]="false"></mat-menu>',
})
class TestSearchDisplayListComponent implements OnInit {
    @Input() children: ListNodeV2[];

    @Output() selectedNode: EventEmitter<ListNodeV2> =
        new EventEmitter<ListNodeV2>();

    @ViewChild('childMenu', { static: true }) public childMenu: MatMenu;

    ngOnInit() {}
}

describe('SearchListValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        const listSpyObj = {
            v2: {
                list: jasmine.createSpyObj('list', ['getList']),
            },
        };

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatInputModule,
                MatMenuModule,
                MatSnackBarModule,
                ReactiveFormsModule,
            ],
            declarations: [
                SearchListValueComponent,
                TestHostComponent,
                TestSearchDisplayListComponent,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: listSpyObj,
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        const listSpy = TestBed.inject(DspApiConnectionToken);

        (
            listSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
        ).getList.and.callFake(() =>
            of(MockList.mockList('http://rdfh.ch/lists/0001/treeList'))
        );

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);

        testHostFixture.detectChanges();
    });

    it('should create', () => {
        const dspSpy = TestBed.inject(DspApiConnectionToken);

        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.listValue).toBeTruthy();

        expect(testHostComponent.listValue.listRootNode).toBeDefined();
        expect(testHostComponent.listValue.listRootNode.isRootNode).toBe(true);

        expect(dspSpy.v2.list.getList).toHaveBeenCalledTimes(1);
        expect(dspSpy.v2.list.getList).toHaveBeenCalledWith(
            'http://rdfh.ch/lists/0001/treeList'
        );
    });

    it('should emit the selected node', async () => {
        const button = await loader.getHarness(MatButtonHarness);

        expect(await button.getText()).toEqual('Select list value');

        await button.click();

        const hostCompDe = testHostFixture.debugElement;
        const searchDisplayListComponent = hostCompDe.query(
            By.directive(TestSearchDisplayListComponent)
        );

        expect(searchDisplayListComponent).not.toBeNull();

        const listNode = new ListNodeV2();
        listNode.id = 'http://rdfh.ch/lists/0001/treeList03';

        (
            searchDisplayListComponent.componentInstance as TestSearchDisplayListComponent
        ).selectedNode.emit(listNode);

        expect(
            testHostComponent.listValue.form.controls['listValue'].value
        ).toEqual('http://rdfh.ch/lists/0001/treeList03');
    });

    it('should get the selected list node', () => {
        testHostComponent.listValue.form.controls['listValue'].setValue(
            'http://rdfh.ch/lists/0001/treeList/01'
        );

        const expectedListNode = new IRI(
            'http://rdfh.ch/lists/0001/treeList/01'
        );

        const listNode = testHostComponent.listValue.getValue();

        expect(listNode).toEqual(expectedListNode);
    });
});
