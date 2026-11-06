import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { LocalizationService, pickPreferredLanguageString } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe } from '@ngx-translate/core';
import { DataModelsRailState } from './data-models-rail-state';
import { RAIL_SECTION_STYLES } from './rail-section-styles';

/** Data models 2 › Lists: the project's lists of controlled values; opening one is not offered yet. */
@Component({
  selector: 'app-data-model-lists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatFormField,
    MatIcon,
    MatInput,
    MatPrefix,
    StringifyStringLiteralPipe,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    <div class="section">
      <div class="head">
        <h2>{{ r + '.lists' | translate }}</h2>
        <span class="counts">{{ r + '.listsCount' | translate: { count: state.lists()?.length ?? 0 } }}</span>
        <span class="spacer"></span>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input
            #search
            matInput
            data-cy="data-model-lists-search"
            [placeholder]="r + '.findList' | translate"
            [attr.aria-label]="r + '.findList' | translate"
            (input)="query.set(search.value)" />
        </mat-form-field>
      </div>

      <div class="cards" data-cy="data-model-lists">
        @for (list of lists(); track list.id) {
          <mat-card appearance="outlined" class="list-card" data-cy="data-model-lists-card">
            <mat-card-content>
              <span class="list-title">
                <mat-icon>arrow_drop_down_circle</mat-icon>
                <b>{{ list.labels | appStringifyStringLiteral }}</b>
              </span>
              @if (list.comments?.length) {
                <span class="list-comment">{{ list.comments | appStringifyStringLiteral }}</span>
              }
            </mat-card-content>
          </mat-card>
        } @empty {
          @if (state.lists()) {
            <p class="empty">{{ r + (state.lists()!.length ? '.noMatch' : '.noLists') | translate }}</p>
          }
        }
      </div>
    </div>
  `,
  styles: [
    RAIL_SECTION_STYLES,
    `
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        align-content: start;
        gap: 12px;
        overflow: auto;
      }

      .list-card mat-card-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .list-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #92400e;
        }

        b {
          font-weight: 500;
        }
      }

      .list-comment {
        font-size: 12px;
        color: #4b5563;
      }
    `,
  ],
})
export class DataModelListsComponent {
  readonly state = inject(DataModelsRailState);
  readonly query = signal('');
  private readonly _localization = inject(LocalizationService);

  readonly lists = computed(() => {
    const query = this.query().trim().toLowerCase();
    const language = this._localization.currentLanguage;
    return (this.state.lists() ?? []).filter(
      list => !query || pickPreferredLanguageString(list.labels, language).toLowerCase().includes(query)
    );
  });
}
