import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
    CreateFileValue,
    CreateStillImageFileValue,
    UpdateFileValue,
    UpdateStillImageFileValue
} from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/dsp-ui';
import { UploadedFile, UploadedFileResponse, UploadFileService } from './upload-file.service';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);


@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {

    @Input() parentForm?: FormGroup;

    @Input() representation: string; // only StillImageRepresentation supported so far

    @Input() formName: string;

    @Output() fileInfo: EventEmitter<CreateFileValue> = new EventEmitter<CreateFileValue>();

    file: File;
    form: FormGroup;
    fileControl: FormControl;
    isLoading = false;
    thumbnailUrl: string;

    // todo: maybe we can use this list to display which file format is allowed to
    supportedImageTypes = ['image/jpeg', 'image/jp2', 'image/tiff', 'image/tiff-fx', 'image/png'];

    // readonly fromLabels = {
    //     upload: 'Upload file',
    //     drag_drop: 'Drag and drop or click to upload'
    // };
    constructor(
        private _fb: FormBuilder,
        private _notification: NotificationService,
        private _upload: UploadFileService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    /**
     * adds file and uploads to SIPI, checking before if conditions met
     * @param event DragDrop event containing upload files
     */
    addFile(event: any): void {
        let files: File[] = [];
        files = event.target?.files ? event.target.files : event;

        // only one file at a time supported
        if (this._isMoreThanOneFile(files)) {
            const error = 'ERROR: Only one file allowed at a time';
            this._notification.openSnackBar(error);
            this.file = null;
        } else {
            const formData = new FormData();
            this.file = files[0];

            // only certain filetypes are supported
            if (!this._isFileTypeSupported(this.file.type)) {
                const error = 'ERROR: File type not supported';
                this._notification.openSnackBar(error);
                this.file = null;
            } else {
                // show loading indicator only for files > 1MB
                this.isLoading = this.file.size > 1048576;

                formData.append(this.file.name, this.file);
                this._upload.upload(formData).subscribe(
                    (res: UploadedFileResponse) => {
                        const temporaryUrl = res.uploadedFiles[0].temporaryUrl;
                        const thumbnailUri = '/full/256,/0/default.jpg';
                        this.thumbnailUrl = `${temporaryUrl}${thumbnailUri}`;

                        this.fileControl.setValue(res.uploadedFiles[0]);
                        const fileValue = this.getNewValue();
                        // console.log('here we should emit the values', res)
                        // console.log(fileValue);

                        if (fileValue) {
                            this.fileInfo.emit(fileValue);
                        }
                        this.isLoading = false;
                    },
                    (e: Error) => {
                        this._notification.openSnackBar(e.message);
                        this.isLoading = false;
                        this.file = null;
                        this.thumbnailUrl = null;
                    }
                );
            }

        }
    }

    /**
     * converts file size to display in KB or MB
     * @param val file size to be converted
     */
    convertBytes(val: number): string {
        const kilo = 1024;
        const mega = kilo * kilo;
        let result: number;

        if (val >= mega) {
            result = val / mega;
            return `${result.toFixed(2)} MB`;
        } else {
            result = val / kilo;
            return `${result.toFixed(2)} KB`;
        }
    }

    /**
     * converts date to a readable format.
     * @param date date to be converted
     */
    convertDate(date: number): string {
        return new Date(+`Date(${date})`.replace(/\D/g, '')).toLocaleDateString();
    }

    /**
     * removes the attachment
     */
    deleteAttachment(): void {
        this.fileControl.reset();
    }

    /**
     * initializes form group
     */
    initializeForm(): void {
        this.fileControl = new FormControl(null, Validators.required);

        this.fileControl.valueChanges.subscribe(
            val => {
                // check if the form has been reset
                if (val === null) {
                    this.file = null;
                    this.thumbnailUrl = null;
                }
            }
        );

        this.form = this._fb.group({
            file: this.fileControl
        }, { updateOn: 'blur' });

        if (this.parentForm !== undefined) {
            resolvedPromise.then(() => {
                this.parentForm.addControl('file', this.form);
            });
        }
    }

    /**
     * resets form group
     */
    resetForm(): void {
        this.form.reset();
    }

    /**
     * create a new file value.
     */
    getNewValue(): CreateFileValue | false {

        if (!this.form.valid) {
            return false;
        }

        const filename = this.fileControl.value.internalFilename;

        // --> TODO: handle different file types

        const fileValue = new CreateStillImageFileValue();
        fileValue.filename = filename;

        return fileValue;

    }

    /**
     * create an updated file value.
     *
     * @param id the current file value's id.
     */
    getUpdatedValue(id: string): UpdateFileValue | false {

        if (!this.form.valid) {
            return false;
        }

        const filename = this.fileControl.value.internalFilename;

        // --> TODO: handle different file types

        const fileValue = new UpdateStillImageFileValue();
        fileValue.filename = filename;
        fileValue.id = id;

        return fileValue;

    }

    /**
     * checks if added file type is supported for certain resource type
     * @param fileType file type to be checked
     */
    private _isFileTypeSupported(fileType: string): boolean {
        return this._supportedFileTypes().includes(fileType);
    }

    /**
     * returns supported file types list for certain resource type
     */
    private _supportedFileTypes(): string[] {
        let allowedFileTypes: string[];
        switch (this.representation) {
            case 'stillImage':
                allowedFileTypes = this.supportedImageTypes;
                break;
            default:
                allowedFileTypes = [];
                break;
        }
        return allowedFileTypes;
    }

    /**
     * checks if more than one file dropped
     * @param files files array to be checked
     */
    private _isMoreThanOneFile(files: File[]): boolean {
        return files.length > 1;
    }

}
