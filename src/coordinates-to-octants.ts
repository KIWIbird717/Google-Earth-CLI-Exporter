import { MAX_OCTANT_LEVEL, URL_PREFIX } from './constants/constants';
import { BBox, FoundOctants, OctantConverter } from './utils/convert-lat-long-to-octant';

const utils = require('./utils/utils')({
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

  public static async convertBbox(bbox: BBox, maxLevel: number): Promise<FoundOctants> {
    return await converter.convertBBoxToOctants(bbox, maxLevel);
  }
}

// (async () => {
//   // const data = await CoordinatesToOctants.convert(43.723056, 10.395833);
//   const data = await CoordinatesToOctants.convertBbox(
//     {
//       northEast: { lat: 43.723889, lon: 10.396389 },
//       southWest: { lat: 43.722222, lon: 10.393056 },
//     },
//     20,
//   );
//   console.log(data);
// })();
