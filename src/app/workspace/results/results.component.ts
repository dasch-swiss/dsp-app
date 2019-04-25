import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {

  searchQuery: string;
  searchMode: string;

  projectIri: string;

  constructor(private _route: ActivatedRoute) {

      this._route.paramMap.subscribe((params: Params) => {
        this.searchMode = params.get('mode');
        this.searchQuery = decodeURIComponent(params.get('q'));
        if (params.get('project') !== null) {
          this.projectIri = decodeURIComponent(params.get('project'));
        }
      });
    }

  ngOnInit() {
  }

}
