import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export type HintTopic = 'search';

@Component({
  selector: 'app-hint',
  templateUrl: './hint.component.html',
  styleUrls: ['./hint.component.scss'],
})
export class HintComponent implements OnInit {
  @Input() topic: HintTopic;

  content: string;

  documentation: string;

  constructor(private _route: ActivatedRoute) {}

  ngOnInit(): void {
    this.content = this._getHint(this.topic);
  }

  /**
   * get correct hint depending on the topic
   * @param topic
   * @returns hint as html
   *
   * todo: the hint should be written in markdown in different languages. Maybe stored in docs.
   */
  private _getHint(topic: HintTopic): string {
    switch (topic) {
      case 'search':
        this.documentation =
          'https://docs.dasch.swiss/latest/DSP-APP/user-guide/data/search';
        return `<p>Use special syntax:</p>
                <ul>
                    <li>question mark<strong>?</strong> can be used as wildcard symbol for a single character.<br>
                        <code class="">Example: <i>be?r</i> will find <i>beer</i> but also <i>bear</i></code>
                    </li><br>
                    <li>asterisk<strong>*</strong> can be used as a wildcard symbol for zero, one or multiple characters.<br>
                        <code class="">Example: <i>b*r</i> will find <i>beer</i> but also <i>bear</i></code>
                    </li><br>
                    <li><strong>"</strong>quotation marks<strong>"</strong> searches for the whole pattern.<br>
                        <code class="">Example: <i>"Lorem ipsum"</i> will find texts with exact content <i>Lorem ipsum</i></code>
                    </li>
                </ul>`;
      default:
        return `There's no hint implemented for the topic <strong>${topic}<strong>.`;
    }
  }
}
