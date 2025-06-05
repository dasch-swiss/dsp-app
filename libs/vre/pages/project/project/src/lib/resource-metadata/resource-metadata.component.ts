import { HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { ExportFormat, V2MetadataApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-resource-metadata',
  templateUrl: './resource-metadata.component.html',
  styleUrl: './resource-metadata.component.scss',
})
export class ResourceMetadataComponent {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);

  readonly project$ = this._reloadSubject.asObservable().pipe(
    switchMap(() => this._store.select(ProjectsSelectors.currentProject)),
    filter(project => project !== undefined),
    map(project => project as ReadProject)
  );

  constructor(
    private _ats: AccessTokenService,
    private _ms: V2MetadataApiService,
    private _store: Store
  ) {}

  download() {
    const shortcode = this._store.selectSnapshot(ProjectsSelectors.currentProject)?.shortcode;
    if (!shortcode) {
      console.error('Project shortcode is not available.');
      return;
    }
    const format: ExportFormat = 'CSV';
    const mimeType = this._getMimeType(format);
    const classIris: string[] | undefined = undefined;
    const authToken = this._ats.getAccessToken() ?? undefined;

    this._ms
      .getV2MetadataProjectsProjectshortcodeResources(shortcode, authToken, format, classIris, 'response', false, {
        httpHeaderAccept: 'text/plain',
      })
      .subscribe((response: HttpResponse<string>) => {
        const blob = new Blob([response.body], { type: mimeType });
        const filename = `project_${shortcode}_metadata`;
        // const fileName = response.headers.get('Content-Disposition');

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      });
  }

  private _getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'csv':
        return 'text/csv';
      case 'tsv':
        return 'text/tab-separated-values';
      case 'json':
        return 'application/json';
      default:
        return 'text/plain';
    }
  }
}
