import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ReadArchiveFileValue,
  ReadAudioFileValue,
  ReadDocumentFileValue,
  ReadMovingImageFileValue,
  ReadProject,
  ReadResource,
  ReadStillImageExternalFileValue,
  ReadStillImageFileValue,
} from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { IKeyValuePairs, ResourceSelectors, UserSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { FileInfo } from './representation.types';
import { ResourceUtil } from './resource.util';

@Injectable({
  providedIn: 'root',
})
export class RepresentationService {
  constructor(
    private _appConfigService: AppConfigService,
    private readonly _http: HttpClient,
    private _store: Store,
    private _accessTokenService: AccessTokenService
  ) {}

  getFileInfo(url: string) {
    const pathToJson = `${url.substring(0, url.lastIndexOf('/'))}/knora.json`;
    return this._http.get<{ originalFilename?: string }>(pathToJson, { withCredentials: true });
  }

  getIngestFileInfo(projectShort: string, assetId: string): Observable<FileInfo> {
    const url = `${this._appConfigService.dspIngestConfig.url}/projects/${projectShort}/assets/${assetId}`;
    return this._http.get<FileInfo>(url);
  }

  getIiifFileInfo(fileName: string, projectShort: string): Observable<FileInfo> {
    const url = `${this._appConfigService.dspIiifConfig.iiifUrl}/${projectShort}/${fileName}/knora.json`;
    return this._http.get<FileInfo>(url);
  }

  getIngestFileUrl(projectShort: string, assetId: string): string {
    const url = `${this._appConfigService.dspIngestConfig.url}/projects/${projectShort}/assets/${assetId}`;
    return url;
  }

  getAttachedProject(parentResource: ReadResource): ReadProject | undefined {
    const attachedProjects = this._store.selectSnapshot(ResourceSelectors.attachedProjects);
    return this.getParentResourceAttachedProject(attachedProjects, parentResource);
  }

  getParentResourceAttachedProject(attachedProjects: IKeyValuePairs<ReadProject>, parentResource: ReadResource) {
    return attachedProjects[parentResource.id] && attachedProjects[parentResource.id].value.length > 0
      ? attachedProjects[parentResource.id].value.find(u => u.id === parentResource.attachedToProject)
      : undefined;
  }

  userCanView(fileValue: ReadDocumentFileValue) {
    return fileValue && ResourceUtil.userCanView(fileValue);
  }

  downloadProjectFile(
    fileValue:
      | ReadAudioFileValue
      | ReadDocumentFileValue
      | ReadMovingImageFileValue
      | ReadStillImageFileValue
      | ReadStillImageExternalFileValue
      | ReadArchiveFileValue,
    resource: ReadResource
  ) {
    const attachedProject = this.getParentResourceAttachedProject(
      this._store.selectSnapshot(ResourceSelectors.attachedProjects),
      resource
    )!;
    if (!attachedProject) {
      throw new AppError('Project is not present');
    }

    const assetId = fileValue.filename.split('.')[0] || '';
    const ingestFileUrl = this.getIngestFileUrl(attachedProject.shortcode, assetId);
    this.downloadFile(ingestFileUrl, this.userCanView(fileValue));
  }

  private downloadFile(url: string, userCanView = true) {
    let headers = {};
    const isLoggedIn = this._store.selectSnapshot(UserSelectors.isLoggedIn);
    if (isLoggedIn && userCanView) {
      const authToken = this._accessTokenService.getAccessToken();
      headers = new HttpHeaders({
        Authorization: `Bearer ${authToken}`,
      });
    }

    this._http
      .get(userCanView ? `${url}/original` : url, {
        responseType: 'blob',
        headers,
        observe: 'response',
      })
      .pipe(take(1))
      .subscribe((res: HttpResponse<Blob>) => {
        const contentDisposition = res.headers.get('content-disposition');
        let fileName: string | null = null;
        if (contentDisposition) {
          const fileNameRegex = /filename\*=(?:([a-zA-Z0-9-]+)''([^;'\n]*))|filename=([^;'\n]*)/;
          const matches = fileNameRegex.exec(contentDisposition);
          fileName =
            matches && matches[2]
              ? decodeURIComponent(matches[2].replace(/\+/g, ' '))
              : matches && matches[3]
                ? matches[3].replace(/['"]/g, '').replace(/\+/g, ' ')
                : null;
        }

        // Fallback to extracting filename from URL if not found
        if (!fileName) {
          fileName = url.split('/').pop()!;
        }

        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(res.body!);
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(a.href);
      });
  }
}
