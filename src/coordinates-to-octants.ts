import { MAX_OCTANT_LEVEL, URL_PREFIX } from './constants/constants';
import { Bbox as GlobalBbox } from './types/types';
import { BBox, FoundOctants, OctantConverter } from './utils/convert-lat-long-to-octant';
import initUtils from './utils/utils';

const utils = initUtils({
  URL_PREFIX,
  DUMP_JSON_DIR: null,
  DUMP_RAW_DIR: null,
  DUMP_JSON: false,
  DUMP_RAW: false,
});

const converter = new OctantConverter(utils);

export class CoordinatesToOctants {
  public static async convert(latitude: number, longitude: number): Promise<FoundOctants> {
    return await converter.convertLatLongToOctant(latitude, longitude, MAX_OCTANT_LEVEL);
  }

  public static async convertBbox(bbox: GlobalBbox, maxLevel: number): Promise<FoundOctants> {
    const serializedBbox: BBox = {
      northEast: { lat: bbox[0].latitude, lon: bbox[0].longitude },
      southWest: { lat: bbox[1].latitude, lon: bbox[1].longitude },
    };
    return await converter.convertBBoxToOctants(serializedBbox, maxLevel);
  }
}
