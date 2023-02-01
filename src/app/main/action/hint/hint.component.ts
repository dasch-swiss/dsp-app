import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-hint',
    templateUrl: './hint.component.html',
    styleUrls: ['./hint.component.scss']
})
export class HintComponent implements OnInit {

    @Input() topic: string;

    content: string;

    documentation: string;

    constructor(
        private _route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        if (!this.topic) {
            // but status is defined in app.routing
            this._route.data.subscribe(data => {
                this.topic = data.topic;
            });
        }

        this.content = this._getHint(this.topic);
    }

    /**
     * get correct hint depending on the topic
     * @param topic
     * @returns hint as html
     *
     * todo: the hint should be written in markdown in different languages. Maybe stored in docs.
     */
    private _getHint(topic: string): string {
        switch(topic) {
            case 'search':
                this.documentation = 'https://docs.dasch.swiss/latest/DSP-APP/user-guide/data/search';
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
                break;
            case 'ontology':
                this.documentation = 'https://docs.dasch.swiss/latest/DSP-APP/user-guide/project/#data-model';
                return `<p>Data Model</p>
                <p>
                    The definition of the data model (ontology) is the most important step.
                    The data model is indispensable for structuring your data. Our platform
                    provides a tool for an easy creation of one or more project data models.
                    First, you have to know which data and sources you want to work with.
                    The data model can be flexible and customizable.
                </p>`;
                break;
            case 'list':
                this.documentation = 'https://docs.dasch.swiss/latest/DSP-APP/user-guide/project/#define-lists';
                return `<p>List Data</p>
                <p>
                Lists are very useful if you want to use controlled vocabulary to describe something.
                Typical examples are keywords.
                </p>`;
                break;

            default:
                return `There's no hint implemented for the topic <strong>${topic}<strong>.`;
        }
    }

}
