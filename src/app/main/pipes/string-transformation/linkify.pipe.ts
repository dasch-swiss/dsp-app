import { Pipe, PipeTransform } from '@angular/core';

/**
 * this pipe analyses a string and converts any url into a href tag
 *
 */
@Pipe({
    name: 'appLinkify'
})
export class LinkifyPipe implements PipeTransform {

    transform(value: string): string {
        let stylizedText = '';
        if (value && value.length > 0) {
            for (let str of value.split(' ')) {
                // if string/url ends with a full stop '.' or colon ':' or comma ',' or semicolon ';' the pipe will not recognize the url
                const lastChar = str.substring(str.length - 1);
                const endsWithFullStop = (lastChar === '.' || lastChar === ':' || lastChar === ',' || lastChar === ';');
                let end = ' ';
                if (endsWithFullStop) {
                    str = str.slice(0, -1);
                    end = lastChar + ' ';
                }
                if (this._recognizeUrl(str)) {
                    const url = this._setProtocol(str);
                    stylizedText += `<a href="${url}" target="_blank">${str}</a>${end}`;
                } else {
                    stylizedText += str + end;
                }
            }
            return stylizedText.trim();
        } else {
            return value;
        }
    }

    private _recognizeUrl(str: string): boolean {
        const pattern = new RegExp(
            '^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // oR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$',
            'i'
        ); // fragment locator
        return pattern.test(str);
    }

    private _setProtocol(url: string): string {
        if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
            url = 'http://' + url;
        }
        return url;
    }

}
