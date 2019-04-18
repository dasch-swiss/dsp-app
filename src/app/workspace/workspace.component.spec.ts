import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiSearchModule } from '@knora/search';
import { AdvancedSearchComponent } from './search/advanced-search/advanced-search.component';
import { ExpertSearchComponent } from './search/expert-search/expert-search.component';
import { WorkspaceComponent } from './workspace.component';
import { KuiCoreModule, KuiCoreConfigToken, KuiCoreConfig } from '@knora/core';

describe('WorkspaceComponent', () => {
    let component: WorkspaceComponent;
    let fixture: ComponentFixture<WorkspaceComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                WorkspaceComponent,
                AdvancedSearchComponent,
                ExpertSearchComponent
            ],
            imports: [
              KuiCoreModule,
              KuiSearchModule,
              RouterTestingModule
            ],
            providers: [
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkspaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
