import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-add-group',
  templateUrl: './add-group.component.html',
  styleUrls: ['./add-group.component.scss']
})
export class AddGroupComponent implements OnInit {

  @Input() projectcode: string;

  @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

  constructor () { }

  ngOnInit() {
  }

  buildForm(): void {

  }
}
