import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Visibility } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { TranslatePipe } from '@ngx-translate/core';

/** Translation-key slugs for `Visibility`, decoupled from the generated enum's casing. */
const VISIBILITY_SLUG: Record<Visibility, string> = {
  Hidden: 'hidden',
  RestrictedView: 'restrictedView',
  Visible: 'visible',
};

/**
 * One audience cell of the restrictions matrix: an eye icon conveying how visible an item is to
 * that audience.
 *
 * The "visible" state renders no icon at all (design decision, to cut visual density). The state is
 * therefore carried by the cell's `aria-label` and tooltip rather than by the glyph alone —
 * otherwise a fully-visible row reads as three empty cells to assistive technology.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-visibility-cell',
  template: `
    <span class="col-aud" role="img" [attr.aria-label]="label | translate" [matTooltip]="label | translate">
      @if (visibility && visibility !== Visibility.Visible) {
        <mat-icon [class]="cssClass">{{ icon }}</mat-icon>
      }
    </span>
  `,
  styleUrl: './visibility-cell.component.scss',
  imports: [MatIcon, MatTooltipModule, TranslatePipe],
})
export class VisibilityCellComponent {
  @Input({ required: true }) visibility!: Visibility | undefined;

  readonly Visibility = Visibility;

  get label(): string {
    const slug = VISIBILITY_SLUG[this.visibility ?? Visibility.Visible] ?? 'visible';
    return `pages.project.viewRestrictions.visibility.${slug}`;
  }

  get icon(): string {
    switch (this.visibility) {
      case Visibility.Hidden:
        return 'visibility_off';
      case Visibility.RestrictedView:
        return 'blur_on';
      default:
        return 'visibility';
    }
  }

  get cssClass(): string {
    return this.visibility === Visibility.Hidden ? 'vis-hidden' : 'vis-restricted';
  }
}
