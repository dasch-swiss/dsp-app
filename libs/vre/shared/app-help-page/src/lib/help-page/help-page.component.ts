import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { VersionApiService, VersionResponse } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspConfig } from '@dasch-swiss/vre/core/config';
import { TranslatePipe } from '@ngx-translate/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import packageJson from '../../../../../../../package.json';
import { FooterComponent } from '../footer/footer.component';
import { GridComponent, GridItem } from '../grid/grid.component';

@Component({
  selector: 'app-help',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.scss'],
  imports: [FooterComponent, GridComponent, MatIconModule, TranslatePipe],
})
export class HelpPageComponent implements OnInit {
  loading = true;

  dsp!: DspConfig;
  releaseNotesUrl!: string;

  appVersion: string = packageJson.version;
  apiVersion?: VersionResponse;

  docs: GridItem[] = [
    {
      icon: 'assignment',
      title: 'pages.help.docs.projectAdmin.title',
      text: 'pages.help.docs.projectAdmin.text',
      url: 'https://dasch.swiss/knowledge-hub/dsp-app/project-admin',
      urlText: 'pages.help.openDocumentation',
    },
    {
      icon: 'bubble_chart',
      title: 'pages.help.docs.dataModel.title',
      text: 'pages.help.docs.dataModel.text',
      url: 'https://dasch.swiss/knowledge-hub/dsp-app/project-admin#data-model',
      urlText: 'pages.help.openDocumentation',
    },
    {
      icon: 'image_search',
      title: 'pages.help.docs.researchTools.title',
      text: 'pages.help.docs.researchTools.text',
      url: 'https://dasch.swiss/knowledge-hub/dsp-app',
      urlText: 'pages.help.openDocumentation',
    },
  ];

  // The titles are product names carrying a version number, so they stay verbatim.
  tools: GridItem[] = [
    {
      title: 'DSP-APP ',
      text: 'pages.help.software.dspApp',
      url: 'https://github.com/dasch-swiss/dsp-app/releases/tag/v',
      urlText: 'pages.help.software.releaseNotes',
    },
    {
      title: 'DSP-API ',
      text: 'pages.help.software.dspApi',
      url: 'https://github.com/dasch-swiss/dsp-api/releases/tag/',
      urlText: 'pages.help.software.releaseNotes',
    },
    {
      title: 'Sipi ',
      text: 'pages.help.software.sipi',
      url: 'https://github.com/dasch-swiss/sipi/releases/tag/',
      urlText: 'pages.help.software.releaseNotes',
    },
  ];

  support: GridItem[] = [
    {
      title: 'pages.help.support.needMoreHelp.title',
      text: 'pages.help.support.needMoreHelp.text',
      url: encodeURI('mailto:support@dasch.swiss?subject=DSP-APP request | '),
      urlText: 'pages.help.support.needMoreHelp.urlText',
    },
    {
      title: 'pages.help.support.infrastructure.title',
      text: 'pages.help.support.infrastructure.text',
      url: 'https://dasch.swiss',
      // A domain name, not a translatable label.
      urlText: 'dasch.swiss',
    },
    {
      title: 'pages.help.support.sourceCode.title',
      text: 'pages.help.support.sourceCode.text',
      url: 'mailto:support@dasch.swiss',
      urlText: 'pages.help.support.sourceCode.urlText',
    },
  ];

  constructor(
    private readonly _versionApiService: VersionApiService,
    private readonly _appConfigService: AppConfigService
  ) {}

  ngOnInit() {
    this.dsp = this._appConfigService.dspConfig;

    this.support[0].url += `${this.dsp.environment}: ${this.dsp.release}`;

    this.releaseNotesUrl = `https://github.com/dasch-swiss/dsp-app/releases/tag/v${this.appVersion}`;

    this._versionApiService.getVersion().subscribe(apiVersion => {
      this.apiVersion = apiVersion;

      // set dsp-app version
      this.tools[0].title += this.appVersion;
      this.tools[0].url += this.appVersion;

      // set dsp-api version
      this.tools[1].title += apiVersion.webapi;
      this.tools[1].url += apiVersion.webapi.split('-')[0];

      // set dsp-sipi version
      this.tools[2].title += apiVersion.sipi;
      this.tools[2].url += apiVersion.sipi;
    });
  }
}
