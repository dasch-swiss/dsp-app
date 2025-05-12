import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { UploadedFileResponse } from './upload-file-response.interface';

@Injectable({
  providedIn: 'root',
})
export class UploadFileService {
  constructor(
    private readonly _acs: AppConfigService,
    private readonly _http: HttpClient
  ) {}

  /**
   * uploads files to ingest server
   * @param (file) The file to upload
   * @param (shortcode) The project shortcode
   */
  upload(file: File, shortcode: string) {
    return this._http.post<UploadedFileResponse>(
      `${this._acs.dspIngestConfig.url}/projects/${shortcode}/assets/ingest/${encodeURIComponent(file.name)}`,
      file,
      {
        reportProgress: false,
        observe: 'body' as const,
        headers: new HttpHeaders({
          'Content-Type': 'application/octet-stream',
        }),
      }
    );
  }

  getFileInfo(assetId: string, shortcode: string) {
    return this._http.get<UploadedFileResponse>(
      `${this._acs.dspIngestConfig.url}/projects/${shortcode}/assets/${encodeURIComponent(assetId)}`
    );
  }
}
