import { Pipe, PipeTransform } from '@angular/core';

/**
 * splits by first argument and returns element from position (second argument)
 *
 * mystr = application/pdf
 * {{ mystr | split: '/':1 }}   --> returns 'pdf'
 */
@Pipe({
    name: 'split',
})
export class SplitPipe implements PipeTransform {
    transform(val: string, separator: string, position: number): string {
        return val.split(separator)[position];
    }

    // transform(value: unknown, ...args: unknown[]): unknown {
    //     return null;
    // }
}
