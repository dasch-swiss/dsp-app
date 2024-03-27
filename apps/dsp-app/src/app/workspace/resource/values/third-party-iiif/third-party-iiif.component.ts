import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { iiifUrlValidator, infoJsonUrlValidatorAsync, previewImageUrlValidatorAsync } from './iiif-url-validator';
import { IIIFUrl } from './third-party-iiif';

@Component({
  selector: 'app-third-part-iiif',
  templateUrl: './third-party-iiif.component.html',
  styleUrls: ['./third-party-iiif.component.scss'],
})
export class ThirdPartyIiifComponent implements OnInit, OnDestroy {
  @Input() iiifUrlValue = '';
  @Output() afterControlInit = new EventEmitter<FormControl<string>>();

  iiifUrlControl: FormControl<string>;

  previewImageUrl: string | null;
  formStatus: 'VALIDATING' | 'LOADING' | 'IDLE' = 'IDLE';

  private _destroy$ = new Subject<void>();

  readonly validatorErrors = [
    { errorKey: 'invalidIiifUrl', message: 'The provided URL is not a valid IIIF image URL' },
    { errorKey: 'previewImageError', message: 'The image cannot be loaded from the third party server' },
    { errorKey: 'infoJsonError', message: 'The iiif info json cannot be loaded from the third party server' },
  ];

  readonly templateString = '{scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}';
  readonly exampleString = 'https://example.org/image-service/abcd1234/full/max/0/default.jpg';

  constructor(
    private _cdr: ChangeDetectorRef,
    private _fb: FormBuilder
  ) {}

  ngOnInit() {
    this.iiifUrlControl = new FormControl(this.iiifUrlValue, {
      validators: [Validators.required, iiifUrlValidator()],
      asyncValidators: [previewImageUrlValidatorAsync(), infoJsonUrlValidatorAsync()],
    });

    this.iiifUrlControl.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(urlStr => {
      const iiifUrl = IIIFUrl.createUrl(urlStr);
      this.previewImageUrl = iiifUrl?.previewImageUrl;
    });

    this.iiifUrlControl.statusChanges.pipe(takeUntil(this._destroy$)).subscribe(state => {
      this.formStatus = state === 'PENDING' ? 'VALIDATING' : 'IDLE';
      this._cdr.detectChanges();
    });

    this.afterControlInit.emit(this.iiifUrlControl);
  }

  pasteFromClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        this.iiifUrlControl.setValue(text);
        this.iiifUrlControl.markAsTouched();
        this.iiifUrlControl.updateValueAndValidity();
      });
    }
  }

  resetIfInvalid() {
    if (this.iiifUrlControl.invalid) {
      this.iiifUrlControl.reset();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
