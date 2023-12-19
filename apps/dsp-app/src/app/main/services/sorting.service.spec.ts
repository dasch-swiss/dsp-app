import { TestBed } from '@angular/core/testing';

import { ReadProject } from '@dasch-swiss/dsp-js';
import { SortingService } from './sorting.service';

describe('SortingService', () => {
  let service: SortingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SortingService],
    });

    service = TestBed.inject(SortingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('reverseArray', () => {
    let data: string[];

    beforeEach(() => {
      data = ['Bernouilli', 'Euler', 'Goldbach', 'Hermann'];
    });

    it('should reverse an array', () => {
      expect(service.reverseArray(data)).toEqual(['Hermann', 'Goldbach', 'Euler', 'Bernouilli']);
    });
  });

  describe('sortByAlphabetical', () => {
    let data: {
      firstname: string;
      lastname: string;
      creator: string;
    }[];

    beforeEach(() => {
      data = [
        {
          firstname: 'Gaston',
          lastname: 'Lagaffe',
          creator: 'André Franquin',
        },
        {
          firstname: 'Mickey',
          lastname: 'Mouse',
          creator: 'Walt Disney',
        },
        {
          firstname: 'Gyro',
          lastname: 'Gearloose',
          creator: 'Carl Barks',
        },
        {
          firstname: 'Charlie',
          lastname: 'Brown',
          creator: 'Charles M. Schulz',
        },
      ];
    });

    it('should return an array sorted by creator', () => {
      const sorted = service.keySortByAlphabetical(data, 'creator');
      expect(sorted).toEqual([
        {
          firstname: 'Gaston',
          lastname: 'Lagaffe',
          creator: 'André Franquin',
        },
        {
          firstname: 'Gyro',
          lastname: 'Gearloose',
          creator: 'Carl Barks',
        },
        {
          firstname: 'Charlie',
          lastname: 'Brown',
          creator: 'Charles M. Schulz',
        },
        {
          firstname: 'Mickey',
          lastname: 'Mouse',
          creator: 'Walt Disney',
        },
      ]);
    });

    it('should return an array sorted by firstname', () => {
      const sorted = service.keySortByAlphabetical(data, 'firstname');
      expect(sorted).toEqual([
        {
          firstname: 'Charlie',
          lastname: 'Brown',
          creator: 'Charles M. Schulz',
        },
        {
          firstname: 'Gaston',
          lastname: 'Lagaffe',
          creator: 'André Franquin',
        },
        {
          firstname: 'Gyro',
          lastname: 'Gearloose',
          creator: 'Carl Barks',
        },
        {
          firstname: 'Mickey',
          lastname: 'Mouse',
          creator: 'Walt Disney',
        },
      ]);
    });

    it('should return an array sorted by lastname', () => {
      const sorted = service.keySortByAlphabetical(data, 'lastname');
      expect(sorted).toEqual([
        {
          firstname: 'Charlie',
          lastname: 'Brown',
          creator: 'Charles M. Schulz',
        },
        {
          firstname: 'Gyro',
          lastname: 'Gearloose',
          creator: 'Carl Barks',
        },
        {
          firstname: 'Gaston',
          lastname: 'Lagaffe',
          creator: 'André Franquin',
        },
        {
          firstname: 'Mickey',
          lastname: 'Mouse',
          creator: 'Walt Disney',
        },
      ]);
    });
  });

  describe('Sort an array of ReadProject', () => {
    let project1: ReadProject;
    let project2: ReadProject;
    let project3: ReadProject;
    let project4: ReadProject;
    let projects: ReadProject[];

    beforeEach(() => {
      project1 = new ReadProject();
      project1.id = '1';
      project1.longname = 'a';

      project2 = new ReadProject();
      project2.id = '2';
      project2.longname = 'b';

      project3 = new ReadProject();
      project3.id = '3';
      project3.longname = 'c';

      project4 = new ReadProject();
      project4.id = '23';
      project4.longname = 'z';

      projects = [project4, project2, project3, project1];
    });

    it('should sort an array of ReadProject by "longname"', () => {
      const sorted = service.keySortByAlphabetical(projects, 'longname');

      expect(sorted).toEqual([project1, project2, project3, project4]);
    });
  });
});
