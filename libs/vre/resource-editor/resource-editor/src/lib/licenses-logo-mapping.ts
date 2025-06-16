export interface LicenseLogoMappingValue {
  imageLink: string;
  link: string;
}

export const LicensesLogoMapping = new Map<string, LicenseLogoMappingValue>([
  [
    'http://rdfh.ch/licenses/cc-by-4.0',
    {
      imageLink: 'http://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by.svg',
      link: 'https://creativecommons.org/licenses/by/4.0/',
    },
  ],
  [
    'http://rdfh.ch/licenses/cc-by-nc-4.0',
    {
      imageLink: 'http://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc.svg',
      link: 'https://creativecommons.org/licenses/by-nc/4.0/',
    },
  ],
  [
    'http://rdfh.ch/licenses/cc-by-nc-nd-4.0',
    {
      imageLink: 'http://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-nd.svg',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    },
  ],
  [
    'http://rdfh.ch/licenses/cc-by-nc-sa-4.0',
    {
      imageLink: 'http://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-sa.svg',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
  ],
  [
    'http://rdfh.ch/licenses/cc-by-nd-4.0',
    {
      imageLink: 'http://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nd.svg',
      link: 'https://creativecommons.org/licenses/by-nd/4.0/',
    },
  ],
  [
    'http://rdfh.ch/licenses/cc-by-sa-4.0',
    {
      imageLink: 'http://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-sa.svg',
      link: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  ],
  [
    'http://rdfh.ch/licenses/cc-0-1.0',
    {
      imageLink: 'http://mirrors.creativecommons.org/presskit/buttons/80x15/svg/cc-zero.svg',
      link: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
  ],
  [
    'http://rdfh.ch/licenses/cc-pdm-1.0',
    {
      imageLink: 'https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/publicdomain.svg',
      link: 'https://creativecommons.org/publicdomain/mark/1.0/',
    },
  ],
]);
