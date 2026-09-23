import { readFileSync } from 'fs';
import { join } from 'path';

describe('index.html', () => {
  it('loads no Fathom script statically, which would bypass the production gate', () => {
    const html = readFileSync(join(__dirname, 'index.html'), 'utf8');

    expect(html).not.toContain('usefathom.com');
  });
});
