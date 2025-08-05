import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProgressSize, SIZE_TO_PXL } from './progress-indicator.type';

@Component({
  standalone: true,
  selector: 'app-progress-indicator',
  imports: [MatIconModule],
  templateUrl: './app-progress-indicator.component.html',
  styleUrls: ['./app-progress-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppProgressIndicatorComponent implements OnInit {
  @Input() size: ProgressSize = 'small';
  widthAndHeight!: string;

  ngOnInit() {
    this.widthAndHeight = `${SIZE_TO_PXL[this.size]}px`;
  }
}
