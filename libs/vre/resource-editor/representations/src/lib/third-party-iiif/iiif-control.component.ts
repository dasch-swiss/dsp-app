import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { startWith, Subscription } from 'rxjs';
import { IIIFUrl } from './third-party-iiif';

@Component({
  selector: 'app-iiif-control',
  template: `
    @if (previewImageUrl) {
      <div class="third-party-iiif-preview">
        <img [src]="previewImageUrl" alt="IIIF Preview" height="240" />
      </div>
    }

    <mat-form-field style="width: 100%">
      <mat-label>IIIF Image URL</mat-label>
      <input
        matInput
        [formControl]="control"
        data-cy="external-iiif-input"
        placeholder="https://example.org/image-service/abcd1234/full/max/0/default.jpg" />

      @if (control.errors; as errors) {
        <mat-error> {{ errors | humanReadableError: validatorErrors }}</mat-error>
      }
    </mat-form-field>
  `,
  styles: [
    `
      .third-party-iiif-preview {
        width: 100%;
        border: 1px solid #000;
        border-radius: 2px;
        padding: 16px 0;
        display: flex;
        flex-direction: row;
        justify-content: center;
        background-color: #f2f2f2;
        overflow: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IiifControlComponent implements OnInit, OnDestroy {
  @Input({ required: true }) control!: FormControl<string | null>;

  previewImageUrl?: string;

  private subscription!: Subscription;

  readonly validatorErrors = [
    { errorKey: 'invalidIiifUrl', message: 'The provided URL is not a valid IIIF image URL.' },
    { errorKey: 'previewImageError', message: 'The image cannot be loaded from the third party server.' },
    { errorKey: 'infoJsonError', message: 'The IIIF info JSON can not be loaded from the third party server.' },
    { errorKey: 'invalidHost', message: 'The provided URL is not from an external source.' },
  ];

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.subscription = this.control.valueChanges.pipe(startWith(this.control.value)).subscribe(urlStr => {
      const url = IIIFUrl.createUrl(urlStr ?? '');
      this.previewImageUrl = url?.previewImageUrl;
      this._cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
