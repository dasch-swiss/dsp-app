import { ShortResInfo } from './short-res-info.interface';

export interface FilteredResources {
  count: number;
  resListIndex: number[];
  resInfo: ShortResInfo[];
  selectionType: 'multiple' | 'single';
}
