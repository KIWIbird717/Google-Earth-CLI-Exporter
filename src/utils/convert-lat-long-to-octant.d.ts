import type { Bulk } from '../../types';

export interface LatLonBox {
  n: number; // north latitude
  s: number; // south latitude
  w: number; // west longitude
  e: number; // east longitude
}

export interface FoundOctantLevel {
  octants: string[];
  box: LatLonBox;
}

export interface FoundOctants {
  [level: number]: FoundOctantLevel;
}

export interface Utils {
  getPlanetoid: () => Promise<any>;
  getBulk: (path: string, epoch: number) => Promise<Bulk>;
  bulk: {
    getIndexByPath: (bulk: Bulk, path: string) => number;
    hasBulkMetadataAtIndex: (bulk: Bulk, index: number) => boolean;
  };
}

export type ConvertLatLongToOctant = (lat: number, lon: number, maxLevel: number) => Promise<FoundOctants>;

export type InitFunction = (utils: Utils) => ConvertLatLongToOctant;
