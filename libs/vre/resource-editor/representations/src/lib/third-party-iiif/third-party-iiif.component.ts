import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import {
  ReadStillImageExternalFileValue,
  UpdateExternalStillImageFileValue,
  CreateStillImageExternalFileValue,
} from '@dasch-swiss/dsp-js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  iiifUrlValidator,
  infoJsonUrlValidatorAsync,
  isExternalHostValidator,
  previewImageUrlValidatorAsync,
} from './iiif-url-validator';
import { IIIFUrl } from './third-party-iiif';

@Component({
  selector: 'app-third-part-iiif',
  templateUrl: './third-party-iiif.component.html',
  styleUrls: ['./third-party-iiif.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ThirdPartyIiifComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThirdPartyIiifComponent implements ControlValueAccessor, OnInit, OnDestroy {
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: ReadStillImageExternalFileValue | null): void {
    if (value) {
      this.iiifUrlControl.patchValue(value?.externalUrl || '');
      this._initialFileValue = value;
      this.iiifUrlControl.updateValueAndValidity();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private _initialFileValue: ReadStillImageExternalFileValue | null = null; // if editing an existing file value

  iiifUrlControl: FormControl<string | null>;

  previewImageUrl: string | undefined;
  previewStatus: 'LOADING' | 'IDLE' = 'IDLE';

  private _destroy$ = new Subject<void>();

  readonly validatorErrors = [
    { errorKey: 'invalidIiifUrl', message: 'The provided URL is not a valid IIIF image URL.' },
    { errorKey: 'previewImageError', message: 'The image cannot be loaded from the third party server.' },
    { errorKey: 'infoJsonError', message: 'The IIIF info JSON can not be loaded from the third party server.' },
    { errorKey: 'invalidHost', message: 'The provided URL is not from an external source.' },
  ];

  readonly exampleString = 'https://example.org/image-service/abcd1234/full/max/0/default.jpg';

  constructor(
    private _cdr: ChangeDetectorRef,
    private _fb: FormBuilder
  ) {
    this.iiifUrlControl = this._fb.control('', {
      validators: [Validators.required, iiifUrlValidator(), isExternalHostValidator()],
      asyncValidators: [previewImageUrlValidatorAsync(), infoJsonUrlValidatorAsync()],
    });
  }

  ngOnInit() {
    this.iiifUrlControl.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(urlStr => {
      const iiifUrl = IIIFUrl.createUrl(urlStr || '');
      this.previewImageUrl = iiifUrl?.previewImageUrl;
    });

    this.iiifUrlControl.statusChanges.pipe(takeUntil(this._destroy$)).subscribe(state => {
      this.previewStatus = state === 'PENDING' ? 'LOADING' : 'IDLE';
      if (state !== 'PENDING' && this.iiifUrlControl.value && this.iiifUrlControl.valid) {
        const fileValue = this._getValue();
        fileValue.externalUrl = this.iiifUrlControl.value;
        this.onChange(fileValue);
      } else {
        this.onChange(null);
      }
      this._cdr.detectChanges();
    });
  }

  private _getValue(): CreateStillImageExternalFileValue | UpdateExternalStillImageFileValue {
    if (this._initialFileValue) {
      const updateValue: UpdateExternalStillImageFileValue = new UpdateExternalStillImageFileValue();
      updateValue.id = this._initialFileValue.id;
      return updateValue;
    } else {
      const fileValue = new CreateStillImageExternalFileValue();
      delete (fileValue as any).filename;
      return fileValue;
    }
  }

  pasteFromClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        this.iiifUrlControl.setValue(text);
        this.iiifUrlControl.markAsTouched();
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
