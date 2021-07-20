import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
    CreateAudioFileValue,
    CreateDocumentFileValue,
    CreateFileValue,
    CreateStillImageFileValue,
    UpdateAudioFileValue,
    UpdateDocumentFileValue,
    UpdateFileValue,
    UpdateStillImageFileValue
} from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/dsp-ui';
import { UploadedFileResponse, UploadFileService } from './upload-file.service';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);


@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {

    @Input() parentForm?: FormGroup;

    @Input() representation: 'stillImage' | 'movingImage' | 'audio' | 'document' | 'text';
    // only StillImageRepresentation and DocumentPresentation is supported so far

    @Input() formName: string;

    @Output() fileInfo: EventEmitter<CreateFileValue> = new EventEmitter<CreateFileValue>();

    file: File;
    form: FormGroup;
    fileControl: FormControl;
    isLoading = false;
    thumbnailUrl: string;

    allowedFileTypes: string[];
    // todo: maybe we can use this list to display which file format is allowed to
    supportedImageTypes = ['image/jpeg', 'image/jp2', 'image/tiff', 'image/tiff-fx', 'image/png'];
    supportedDocumentTypes = ['application/pdf'];
    supportedAudioTypes = ['audio/mpeg'];

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
        this._supportedFileTypes();
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

                        // prepare thumbnail url to display something after upload
                        switch (this.representation) {
                            case 'stillImage':
                                const temporaryUrl = res.uploadedFiles[0].temporaryUrl;
                                const thumbnailUri = '/full/256,/0/default.jpg';
                                this.thumbnailUrl = `${temporaryUrl}${thumbnailUri}`;
                                break;

                            case 'document':
                                // the preview thumbnail is deactivated for the moment;
                                // --> TODO: it will be activated as soon as we implement a pdf viewer
                                // this.thumbnailUrl = res.uploadedFiles[0].temporaryUrl;
                                this.thumbnailUrl = undefined;
                                break;

                            default:
                                this.thumbnailUrl = undefined;
                                break;
                        }

                        this.fileControl.setValue(res.uploadedFiles[0]);
                        const fileValue = this.getNewValue();

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

        let fileValue: CreateStillImageFileValue | CreateDocumentFileValue;

        switch (this.representation) {
            case 'stillImage':
                fileValue = new CreateStillImageFileValue();
                break;

            case 'document':
                fileValue = new CreateDocumentFileValue();
                break;

            case 'audio':
                fileValue = new CreateAudioFileValue();
                break;

            default:
                // --> TODO for UPLOAD: expand with other representation file types
                break;
        }

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

        let fileValue: UpdateStillImageFileValue | UpdateDocumentFileValue | UpdateAudioFileValue;


        switch (this.representation) {
            case 'stillImage':
                fileValue = new UpdateStillImageFileValue();
                break;

            case 'document':
                fileValue = new UpdateDocumentFileValue();
                break;

            case 'audio':
                fileValue = new UpdateAudioFileValue();
                break;
            default:
                // --> TODO for UPLOAD: expand with other representation file types
                break;
        }

        // const fileValue = new UpdateStillImageFileValue();
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
        this.allowedFileTypes = [];
        switch (this.representation) {
            case 'stillImage':
                this.allowedFileTypes = this.supportedImageTypes;
                break;
            case 'document':
                this.allowedFileTypes = this.supportedDocumentTypes;
                break;
            case 'audio':
                this.allowedFileTypes = this.supportedAudioTypes;
                break;
            default:
                this.allowedFileTypes = [];
                break;
        }
        return this.allowedFileTypes;
    }

    /**
     * checks if more than one file dropped
     * @param files files array to be checked
     */
    private _isMoreThanOneFile(files: File[]): boolean {
        return files.length > 1;
    }

}
