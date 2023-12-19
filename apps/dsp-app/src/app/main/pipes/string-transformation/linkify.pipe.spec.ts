/* eslint-disable max-len */
import { LinkifyPipe } from './linkify.pipe';

describe('LinkifyPipe', () => {
  let pipe: LinkifyPipe;

  beforeEach(() => {
    pipe = new LinkifyPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should not recognize the url if protocol does not exist', () => {
    const text = 'You can visit the app on app.dasch.swiss/#';
    const linkifiedSnippet = pipe.transform(text);
    expect(linkifiedSnippet).toEqual(
      'You can visit the app on app.dasch.swiss/#'
    );
  });

  it('should recognize the url with protocol followed by full stop', () => {
    const text = 'You can visit the app on https://app.dasch.swiss.';
    const linkifiedSnippet = pipe.transform(text);
    expect(linkifiedSnippet).toEqual(
      'You can visit the app on <a href="https://app.dasch.swiss" target="_blank">https://app.dasch.swiss</a>.'
    );
  });

  it('should recognize both urls in the example text', () => {
    const text =
      'You can visit the app on https://app.dasch.swiss and the documentation on https://docs.dasch.swiss.';
    const linkifiedSnippet = pipe.transform(text);
    expect(linkifiedSnippet).toEqual(
      'You can visit the app on <a href="https://app.dasch.swiss" target="_blank">https://app.dasch.swiss</a> and the documentation on <a href="https://docs.dasch.swiss" target="_blank">https://docs.dasch.swiss</a>.'
    );
  });

  it('should keep the spaces after a full stop or after a comma', () => {
    const text =
      "This is just a title. And it could have an URL, but it doesn't have one. ";
    const linkifiedSnippet = pipe.transform(text);
    expect(linkifiedSnippet).toEqual(
      "This is just a title. And it could have an URL, but it doesn't have one. "
    );
  });
});
