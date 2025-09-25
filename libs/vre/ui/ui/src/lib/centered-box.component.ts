import { Component } from '@angular/core';

@Component({
  selector: 'app-centered-box',
  template: `
    <div style="display: flex; justify-content: center; align-items: center; text-align: center;  margin-top: 100px">
      <div>
        <ng-content />
      </div>
    </div>
  `,
  standalone: false,
})
export class CenteredBoxComponent {}
