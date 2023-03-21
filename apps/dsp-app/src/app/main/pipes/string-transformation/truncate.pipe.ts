import { Pipe, PipeTransform } from '@angular/core';

/**
 * this pipe can be used to shorten long text by a defined length.
 *
 * In markup:
 *
 * {{ str | appTruncate:24 }}
 *
 * or
 *
 * {{ str | appTruncate:24:'...' }}
 *
 * The first optional parameter defines the length where to truncate the string.
 * The second optional parameter defines the characters to append to the shortened string. Default is '...'.
 *
 * The advantage of this pipe over the default Angular slice pipe is the simplicity of adding
 *  additional characters at the end of the shortened string.
 * The same construct with Angular slice pipe looks as follow: `{{ (str.length>24)? (str | slice:0:24)+'...':(str) }}`.
 *
 */
@Pipe({
    name: 'appTruncate',
})
export class TruncatePipe implements PipeTransform {
    defaultLimit = 20;
    defaultTrail = '...';

    transform(value: string, limit?: number, trail?: string): string {
        if (typeof value !== 'string' || value.length === 0) {
            return '';
        }

        // if a custom limit was provided, use that. Otherwise, use the default limit of 20 characters
        const limitSetting: number =
            limit !== undefined ? limit : this.defaultLimit;

        // if a custom trail was provided, use that. Otherwise, use the default trail of '...'
        const trailSetting: string =
            trail !== undefined ? trail : this.defaultTrail;

        return value.length > limitSetting
            ? value.substring(0, limitSetting) + trailSetting
            : value;
    }
}
