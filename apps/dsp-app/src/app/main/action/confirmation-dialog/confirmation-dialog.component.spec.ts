import { OverlayContainer } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Input, OnInit } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialog as MatDialog,
    MatLegacyDialogModule as MatDialogModule,
    MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { MatLegacyDialogHarness as MatDialogHarness } from '@angular/material/legacy-dialog/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockResource, ReadIntValue, ReadValue } from '@dasch-swiss/dsp-js';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogValueDeletionPayload,
} from './confirmation-dialog.component';

/**
 * test host component to simulate parent component with a confirmation dialog.
 */
@Component({
    template: ` <p>{{ confirmationDialogResponse }}</p>`,
})
class ConfirmationDialogTestHostComponent implements OnInit {
    confirmationDialogResponse: string;

    testValue: ReadIntValue;

    constructor(private dialog: MatDialog) {}

    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            this.testValue = res.getValuesAs(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger',
                ReadIntValue
            )[0];
        });
    }

    openDialog() {
        this.dialog
            .open(ConfirmationDialogComponent, {
                data: {
                    value: this.testValue,
                    buttonTextOk: 'OK',
                    buttonTextCancel: 'Cancel',
                },
            })
            .afterClosed()
            .subscribe((payload: ConfirmationDialogValueDeletionPayload) => {
                if (payload && payload.confirmed) {
                    this.confirmationDialogResponse = 'Action was confirmed!';
                } else {
                    this.confirmationDialogResponse = 'Action was cancelled';
                }
            });
    }
}

@Component({ selector: 'app-confirmation-message', template: '' })
class MockConfirmationMessageComponent {
    @Input() value: ReadValue;

    constructor() {}
}

describe('ConfirmationDialogComponent', () => {
    let testHostComponent: ConfirmationDialogTestHostComponent;
    let testHostFixture: ComponentFixture<ConfirmationDialogTestHostComponent>;
    let rootLoader: HarnessLoader;
    let overlayContainer: OverlayContainer;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                ConfirmationDialogComponent,
                ConfirmationDialogTestHostComponent,
                MockConfirmationMessageComponent,
            ],
            imports: [MatDialogModule, BrowserAnimationsModule],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
            ],
        }).compileComponents();

        overlayContainer = TestBed.inject(OverlayContainer);
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(
            ConfirmationDialogTestHostComponent
        );
        testHostComponent = testHostFixture.componentInstance;
        rootLoader =
            TestbedHarnessEnvironment.documentRootLoader(testHostFixture);
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    afterEach(async () => {
        const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
        await Promise.all(dialogs.map(async (d) => await d.close()));

        // angular won't call this for us so we need to do it ourselves to avoid leaks.
        overlayContainer.ngOnDestroy();
    });

    it('should display a confirmation dialog', async () => {
        testHostComponent.openDialog();

        testHostFixture.detectChanges();

        await testHostFixture.whenStable();

        const dialogDiv = document.querySelector('mat-dialog-container');
        expect(dialogDiv).toBeTruthy();

        const dspConfirmMsg = document.querySelector(
            'app-confirmation-message'
        );
        expect(dspConfirmMsg).toBeTruthy();

        const dialogTitle = dialogDiv.querySelector('.title');
        expect(dialogTitle.innerHTML.trim()).toEqual(
            'Are you sure you want to delete this value from Integer?'
        );
    });

    it('should return a confirmation message when the OK button is clicked', async () => {
        testHostComponent.openDialog();

        testHostFixture.detectChanges();

        await testHostFixture.whenStable();

        let dialogHarnesses = await rootLoader.getAllHarnesses(
            MatDialogHarness
        );

        const okButton = await rootLoader.getHarness(
            MatButtonHarness.with({ selector: '.ok' })
        );

        await okButton.click();

        dialogHarnesses = await rootLoader.getAllHarnesses(MatDialogHarness);

        expect(dialogHarnesses).toBeDefined();
        expect(testHostComponent.confirmationDialogResponse).toEqual(
            'Action was confirmed!'
        );
    });

    it('should return a cancelled message when the cancel button is clicked', async () => {
        testHostComponent.openDialog();

        testHostFixture.detectChanges();

        await testHostFixture.whenStable();

        let dialogHarnesses = await rootLoader.getAllHarnesses(
            MatDialogHarness
        );

        const cancelButton = await rootLoader.getHarness(
            MatButtonHarness.with({ selector: '.cancel' })
        );

        await cancelButton.click();

        dialogHarnesses = await rootLoader.getAllHarnesses(MatDialogHarness);

        expect(dialogHarnesses).toBeDefined();
        expect(testHostComponent.confirmationDialogResponse).toEqual(
            'Action was cancelled'
        );
    });
});
