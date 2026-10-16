import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnChanges,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceLegalV2ApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspResource, filterUndefined } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { ResourceAuthorshipComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceUtil } from '../representation/resource.util';

/**
 * A resource's authorship, shown and edited exactly as the resource viewer's rights statement does
 * it, for hosts that show it on its own — the Data tab's table (DEV-7494).
 *
 * Saves the way the viewer's statement does, then reloads the resource through its own primed
 * `ResourceFetcherService` and reports the reload, as the table's other editable cells do.
 */
@Component({
  selector: 'app-editable-resource-authorship',
  imports: [ResourceAuthorshipComponent],
  template: `
    <app-resource-authorship
      [resourceAuthorship]="dspResource().res.resourceAuthorship"
      [defaultResourceAuthorship]="defaultAuthorship()"
      [canEditAuthorship]="canEdit()"
      (saveAuthorship)="save($event)" />
  `,
  styles: [':host { display: block; min-width: 0; }'],
  providers: [ResourceFetcherService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableResourceAuthorshipComponent implements OnChanges {
  readonly dspResource = input.required<DspResource>();
  /** The project's default authorship, shown as the labelled fallback when the resource has none. */
  readonly defaultAuthorship = input<string[]>([]);

  /** The resource as dsp-api holds it after the authorship was saved. */
  readonly resourceUpdated = output<ReadResource>();

  protected readonly canEdit = computed(() => ResourceUtil.userCanEdit(this.dspResource().res));

  private readonly _fetcher = inject(ResourceFetcherService);
  private readonly _legal = inject(ResourceLegalV2ApiService);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);
  private readonly _destroyRef = inject(DestroyRef);
  private _primed?: ReadResource;

  constructor() {
    // Anything but our own prime is the reload after a save.
    this._fetcher.resource$.pipe(filterUndefined(), takeUntilDestroyed()).subscribe(resource => {
      if (resource.res !== this._primed) {
        this.resourceUpdated.emit(resource.res);
      }
    });
  }

  ngOnChanges() {
    this._primed = this.dspResource().res;
    this._fetcher.prime(this.dspResource());
  }

  protected save(authorship: string[]): void {
    const resource = this.dspResource().res;
    this._legal
      .updateResourceAuthorship(resource.id, resource.type, authorship, resource.lastModificationDate)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._fetcher.reload();
          this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saved'));
        },
        error: () => this._notification.openSnackBar(this._translate.instant('legal.dataSide.settings.saveError')),
      });
  }
}
