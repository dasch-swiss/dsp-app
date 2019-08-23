import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule, MatTreeModule } from '@angular/material';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { ListItemsComponent } from './list-items.component';

describe('ListItemsComponent', () => {
    let component: ListItemsComponent;
    let fixture: ComponentFixture<ListItemsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ListItemsComponent
            ],
            imports: [
                KuiCoreModule,
                MatIconModule,
                MatTreeModule
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
        fixture = TestBed.createComponent(ListItemsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
