import { Component, DebugElement } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropDirective } from './drag-drop.directive';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <div
        appDragDrop
        class="dd-container"
        (fileDropped)="filesDropped($event)"
    ></div>`,
})
class TestHostComponent {
    files: FileList;

    filesDropped(files: FileList) {
        this.files = files;
    }
}

describe('DragDropDirective', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let dragDropInput: DebugElement;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [DragDropDirective, TestHostComponent],
            imports: [
                BrowserAnimationsModule,
                MatIconModule,
                MatInputModule,
                MatSnackBarModule,
                ReactiveFormsModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        dragDropInput = testHostFixture.debugElement.query(
            By.css('.dd-container')
        );

        expect(testHostComponent).toBeTruthy();
    });

    it('should create an instance', () => {
        const directive = new DragDropDirective();
        expect(directive).toBeTruthy();
    });

    it('should change background-color of input on dragover event', () => {
        const dragOver = new DragEvent('dragover');
        const color = 'rgb(221, 221, 221)'; // = #ddd

        spyOn(dragOver, 'preventDefault');
        spyOn(dragOver, 'stopPropagation');

        dragDropInput.triggerEventHandler('dragover', dragOver);
        testHostFixture.detectChanges();

        expect(dragDropInput.nativeElement.style.backgroundColor).toBe(color);

        expect(dragOver.stopPropagation).toHaveBeenCalled();
        expect(dragOver.preventDefault).toHaveBeenCalled();
    });

    it('should change background-color of input on dragleave event', () => {
        const dragLeave = new DragEvent('dragleave');
        const color = 'rgb(242, 242, 242)'; // = #f2f2f2

        spyOn(dragLeave, 'preventDefault');
        spyOn(dragLeave, 'stopPropagation');

        dragDropInput.triggerEventHandler('dragleave', dragLeave);
        testHostFixture.detectChanges();

        expect(dragDropInput.nativeElement.style.backgroundColor).toBe(color);

        expect(dragLeave.stopPropagation).toHaveBeenCalled();
        expect(dragLeave.preventDefault).toHaveBeenCalled();
    });

    it('should change background-color of input on drop event', () => {
        const mockFile = new File(['1'], 'testfile');

        // https://stackoverflow.com/questions/57080760/fake-file-drop-event-for-unit-testing
        const drop = {
            preventDefault: () => {},
            stopPropagation: () => {},
            dataTransfer: { files: [mockFile] },
        };

        const color = 'rgb(242, 242, 242)'; // = #f2f2f2

        spyOn(drop, 'preventDefault');
        spyOn(drop, 'stopPropagation');

        expect(testHostComponent.files).toBeUndefined();

        dragDropInput.triggerEventHandler('drop', drop);
        testHostFixture.detectChanges();

        expect(dragDropInput.nativeElement.style.backgroundColor).toBe(color);
        expect(testHostComponent.files.length).toEqual(1);
        expect(testHostComponent.files[0].name).toEqual('testfile');

        expect(drop.stopPropagation).toHaveBeenCalled();
        expect(drop.preventDefault).toHaveBeenCalled();
    });
});
