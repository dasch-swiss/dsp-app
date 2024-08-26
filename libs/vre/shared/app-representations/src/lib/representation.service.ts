import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RepresentationService {
  constructor(private readonly _http: HttpClient) {}

  getFileInfo(url: string, imageFilename?: string) {
    let pathToJson = '';

    if (imageFilename) {
      const index = url.indexOf(imageFilename);
      pathToJson = `${url.substring(0, index + imageFilename.length)}/knora.json`;
    } else {
      pathToJson = `${url.substring(0, url.lastIndexOf('/'))}/knora.json`;
    }

    return this._http.get<{ originalFilename?: string }>(pathToJson, { withCredentials: true });
  }

  async downloadFile(url: string, imageFilename?: string) {
    const res = await this._http.get(url, { responseType: 'blob', withCredentials: true }).toPromise();

    this.getFileInfo(url, imageFilename).subscribe(response => {
      const originalFilename = response.originalFilename;

      const objUrl = window.URL.createObjectURL(res);
      const e = document.createElement('a');
      e.href = objUrl;

      // set filename
      if (originalFilename === undefined) {
        e.download = url.substring(url.lastIndexOf('/') + 1);
      } else {
        e.download = originalFilename;
      }

      document.body.appendChild(e);
      e.click();
      document.body.removeChild(e);
    });
  }
}
